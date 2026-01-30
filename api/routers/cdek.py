import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from models import CDEKCalculateRequest
from services.cdek import (
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
    city_code: int = Query(..., description="Код города СДЭК"),
    point_type: Optional[str] = Query(None, alias="type", description="Тип: PVZ или POSTAMAT"),
    allowed_cod: Optional[bool] = Query(None, description="Наложенный платеж"),
    service: CDEKDeliveryPointsService = Depends(get_cdek_points_service),
):
    """Get delivery points for a specific city."""
    try:
        points = await service.get_points_by_city(
            city_code=city_code,
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
