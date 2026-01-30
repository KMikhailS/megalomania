import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from models import CDEKCalculateRequest
from services.cdek import (
    BoundingBox,
    CDEKAuthService,
    CDEKCalculatorService,
    CDEKClient,
    CDEKDeliveryPointsService,
    CDEKSettings,
    TTLCache,
)


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cdek", tags=["cdek"])

_cache = TTLCache()
_settings: Optional[CDEKSettings] = None
_auth_service: Optional[CDEKAuthService] = None
_client: Optional[CDEKClient] = None
_points_service: Optional[CDEKDeliveryPointsService] = None
_calculator_service: Optional[CDEKCalculatorService] = None


def get_cdek_settings() -> CDEKSettings:
    global _settings
    if _settings is not None:
        return _settings
    try:
        _settings = CDEKSettings.from_env()
        return _settings
    except ValueError as exc:
        logger.error("CDEK settings error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        )


def get_cdek_client() -> CDEKClient:
    global _auth_service, _client
    settings = get_cdek_settings()

    if _auth_service is None:
        _auth_service = CDEKAuthService(settings=settings, cache=_cache)
    if _client is None:
        _client = CDEKClient(settings=settings, auth=_auth_service)
    return _client


def get_cdek_points_service() -> CDEKDeliveryPointsService:
    global _points_service
    if _points_service is None:
        settings = get_cdek_settings()
        client = get_cdek_client()
        _points_service = CDEKDeliveryPointsService(client=client, cache=_cache, settings=settings)
    return _points_service


def get_cdek_calculator_service() -> CDEKCalculatorService:
    global _calculator_service
    if _calculator_service is None:
        settings = get_cdek_settings()
        client = get_cdek_client()
        points_service = get_cdek_points_service()
        _calculator_service = CDEKCalculatorService(
            client=client,
            points_service=points_service,
            settings=settings,
        )
    return _calculator_service


@router.get("/delivery-points")
async def get_delivery_points(
    south: float = Query(..., description="Южная граница (min lat)"),
    west: float = Query(..., description="Западная граница (min lon)"),
    north: float = Query(..., description="Северная граница (max lat)"),
    east: float = Query(..., description="Восточная граница (max lon)"),
    point_type: Optional[str] = Query(None, alias="type", description="Тип: PVZ или POSTAMAT"),
    allowed_cod: Optional[bool] = Query(None, description="Наложенный платеж"),
    zoom: Optional[int] = Query(None, description="Текущий zoom карты"),
    service: CDEKDeliveryPointsService = Depends(get_cdek_points_service),
):
    min_zoom = 11
    if zoom is not None and zoom < min_zoom:
        return {
            "points": [],
            "total": 0,
            "warning": {
                "code": "ZOOM_TOO_LOW",
                "message": "Приблизьте карту для отображения пунктов выдачи",
                "min_zoom": min_zoom,
            },
        }

    bbox = BoundingBox(south=south, west=west, north=north, east=east)
    bbox_area = abs(north - south) * abs(east - west)
    max_bbox_area = 4.0
    if bbox_area > max_bbox_area:
        return {
            "points": [],
            "total": 0,
            "warning": {
                "code": "AREA_TOO_LARGE",
                "message": "Область слишком большая. Приблизьте карту.",
            },
        }

    try:
        points = await service.get_points_by_bbox(
            bbox=bbox,
            point_type=point_type,
            allowed_cod=allowed_cod,
        )
    except Exception as exc:
        logger.error("Failed to load delivery points: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to load delivery points",
        )

    return {
        "points": points,
        "total": len(points),
        "bbox": {
            "south": south,
            "west": west,
            "north": north,
            "east": east,
        },
    }


@router.get("/delivery-points/{code}")
async def get_delivery_point_detail(
    code: str,
    service: CDEKDeliveryPointsService = Depends(get_cdek_points_service),
):
    point = await service.get_point_by_code(code)
    if not point:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ПВЗ не найден")
    return point


@router.post("/calculate")
async def calculate_delivery(
    request: CDEKCalculateRequest,
    service: CDEKCalculatorService = Depends(get_cdek_calculator_service),
):
    try:
        result = await service.calculate(
            delivery_point_code=request.delivery_point_code,
            weight=request.weight,
            dimensions={
                "length": request.length,
                "width": request.width,
                "height": request.height,
            },
            declared_value=request.declared_value,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to calculate delivery: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to calculate delivery",
        )

    return result


@router.get("/cities")
async def search_cities(
    query: str = Query(..., min_length=2, description="Поиск по названию"),
    limit: int = Query(10, le=50),
    service: CDEKDeliveryPointsService = Depends(get_cdek_points_service),
):
    try:
        cities = await service.search_cities(query, limit)
    except Exception as exc:
        logger.error("Failed to search cities: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to search cities",
        )

    return {
        "cities": cities,
        "total": len(cities),
    }


# Москва как город по умолчанию
DEFAULT_CITY = {
    "city_code": 44,
    "name": "Москва",
    "latitude": 55.7558,
    "longitude": 37.6173,
}


@router.get("/user-city")
async def get_user_city(
    request: Request,
    service: CDEKDeliveryPointsService = Depends(get_cdek_points_service),
):
    """
    Определить город пользователя по IP-адресу.
    Использует ip-api.com для геолокации, затем ищет ближайший город СДЭК.
    """
    # Получаем IP клиента (учитываем прокси)
    client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
    if not client_ip:
        client_ip = request.headers.get("X-Real-IP", "")
    if not client_ip and request.client:
        client_ip = request.client.host

    # Локальные IP возвращают Москву
    if not client_ip or client_ip in ("127.0.0.1", "localhost", "::1") or client_ip.startswith("192.168.") or client_ip.startswith("10."):
        logger.info("Local IP detected, returning default city Moscow")
        return DEFAULT_CITY

    # Запрос к ip-api.com
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"http://ip-api.com/json/{client_ip}",
                params={"fields": "status,city,lat,lon", "lang": "ru"},
            )
            data = response.json()

            if data.get("status") != "success":
                logger.warning("ip-api.com returned non-success for IP %s: %s", client_ip, data)
                return DEFAULT_CITY

            lat = data.get("lat")
            lon = data.get("lon")
            city_name = data.get("city", "")

            if lat is None or lon is None:
                return DEFAULT_CITY

            logger.info("IP %s resolved to %s (%.4f, %.4f)", client_ip, city_name, lat, lon)

    except Exception as exc:
        logger.error("Failed to get location from ip-api.com: %s", exc)
        return DEFAULT_CITY

    # Ищем ближайший город СДЭК по координатам
    try:
        nearest_city = await service.find_nearest_city(lat, lon)
        if nearest_city:
            return {
                "city_code": nearest_city["code"],
                "name": nearest_city["name"],
                "latitude": nearest_city["latitude"],
                "longitude": nearest_city["longitude"],
            }
    except Exception as exc:
        logger.error("Failed to find nearest CDEK city: %s", exc)

    # Если город СДЭК не найден, возвращаем координаты от ip-api
    return {
        "city_code": None,
        "name": city_name,
        "latitude": lat,
        "longitude": lon,
    }
