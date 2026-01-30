import os
import logging
import time
from fastapi import APIRouter, Query, Request, Response
from fastapi.responses import JSONResponse
from typing import Optional
import httpx
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cdek", tags=["cdek"])

CDEK_ACCOUNT = os.getenv("CDEK_ACCOUNT")
CDEK_SECURE = os.getenv("CDEK_SECURE")
CDEK_API_URL = "https://api.cdek.ru/v2"
_CDEK_TOKEN: Optional[str] = None
_CDEK_TOKEN_EXPIRES_AT: float = 0.0


async def get_cdek_token() -> Optional[str]:
    """Получить OAuth токен СДЭК"""
    if not CDEK_ACCOUNT or not CDEK_SECURE:
        logger.error("CDEK credentials not configured")
        return None

    global _CDEK_TOKEN, _CDEK_TOKEN_EXPIRES_AT
    if _CDEK_TOKEN and time.time() < _CDEK_TOKEN_EXPIRES_AT:
        return _CDEK_TOKEN

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{CDEK_API_URL}/oauth/token",
                data={
                    "grant_type": "client_credentials",
                    "client_id": CDEK_ACCOUNT,
                    "client_secret": CDEK_SECURE
                }
            )
            if response.status_code != 200:
                logger.error(f"Failed to get CDEK token: {response.text}")
                return None

            data = response.json()
            token = data.get("access_token")
            if not token:
                logger.error("CDEK token missing in response")
                return None

            expires_in = data.get("expires_in", 3600)
            try:
                expires_in = int(expires_in)
            except (TypeError, ValueError):
                expires_in = 3600

            # Обновляем токен с запасом, чтобы избежать работы на грани истечения.
            _CDEK_TOKEN = token
            _CDEK_TOKEN_EXPIRES_AT = time.time() + max(60, expires_in - 60)
            return token
    except Exception as e:
        logger.error(f"Error getting CDEK token: {e}")
        return None


@router.get("/service.php")
async def service_php(
    request: Request,
    action: str = Query(...),
    page: int = Query(0),
    size: int = Query(100),
    city_code: Optional[int] = Query(None),
    postal_code: Optional[str] = Query(None),
    is_handout: Optional[bool] = Query(None),
    type: Optional[str] = Query(None),
):
    """
    Эмуляция service.php для виджета СДЭК.
    Поддерживает action=offices и action=calculate
    """
    token = await get_cdek_token()
    if not token:
        return JSONResponse(
            status_code=400,
            content={"error": "Failed to authenticate with CDEK"}
        )

    if action == "offices":
        return await get_offices(token, page, size, city_code, postal_code, is_handout, type)
    elif action == "calculate":
        # Для calculate нужно получить body из POST запроса
        return JSONResponse(
            status_code=400,
            content={"error": "Calculate action requires POST request"}
        )
    else:
        return JSONResponse(
            status_code=400,
            content={"error": f"Unknown action: {action}"}
        )


@router.post("/service.php")
async def service_php_post(request: Request):
    """
    POST endpoint для service.php (для calculate)
    """
    token = await get_cdek_token()
    if not token:
        return JSONResponse(
            status_code=400,
            content={"error": "Failed to authenticate with CDEK"}
        )

    try:
        body = await request.json()
    except:
        body = {}

    action = body.get("action", "")

    if action == "calculate":
        return await calculate_delivery(token, body)
    else:
        return JSONResponse(
            status_code=400,
            content={"error": f"Unknown action: {action}"}
        )


async def get_offices(
    token: str,
    page: int,
    size: int,
    city_code: Optional[int],
    postal_code: Optional[str],
    is_handout: Optional[bool],
    type_filter: Optional[str]
):
    """Получить список пунктов выдачи СДЭК"""
    params = {
        "page": page,
        "size": size
    }
    if city_code:
        params["city_code"] = city_code
    if postal_code:
        params["postal_code"] = postal_code
    if is_handout is not None:
        params["is_handout"] = "true" if is_handout else "false"
    if type_filter:
        params["type"] = type_filter

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{CDEK_API_URL}/deliverypoints",
                headers={"Authorization": f"Bearer {token}"},
                params=params
            )

            # Создаём ответ с нужными заголовками для виджета
            headers = {
                "X-Service-Version": "3.11.1",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Expose-Headers": "X-Current-Page, X-Total-Elements, X-Total-Pages, X-Service-Version"
            }

            # Копируем заголовки пагинации из ответа CDEK
            for header_name in ["X-Current-Page", "X-Total-Elements", "X-Total-Pages"]:
                if header_name.lower() in response.headers:
                    headers[header_name] = response.headers[header_name.lower()]
                elif header_name in response.headers:
                    headers[header_name] = response.headers[header_name]

            if response.status_code != 200:
                logger.error(f"Failed to get CDEK offices: {response.text}")
                return JSONResponse(
                    status_code=response.status_code,
                    content={"error": "Failed to get delivery points"},
                    headers=headers
                )

            return Response(
                content=response.content,
                status_code=200,
                media_type="application/json",
                headers=headers
            )
    except Exception as e:
        logger.error(f"Error getting CDEK offices: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


async def calculate_delivery(token: str, body: dict):
    """Рассчитать стоимость доставки"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{CDEK_API_URL}/calculator/tarifflist",
                headers={"Authorization": f"Bearer {token}"},
                json=body
            )

            headers = {
                "X-Service-Version": "3.11.1",
                "Access-Control-Allow-Origin": "*"
            }

            return Response(
                content=response.content,
                status_code=response.status_code,
                media_type="application/json",
                headers=headers
            )
    except Exception as e:
        logger.error(f"Error calculating delivery: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )
