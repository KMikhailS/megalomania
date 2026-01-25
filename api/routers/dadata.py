import os
import time
import logging
import httpx
from fastapi import APIRouter, HTTPException, Query

from models import AddressSuggestionDTO

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dadata", tags=["dadata"])

# DaData API configuration
DADATA_API_URL = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address"


# Simple TTL cache: {query: (result, timestamp)}
_cache: dict[str, tuple[list[AddressSuggestionDTO], float]] = {}
CACHE_TTL = 300  # 5 minutes


def _get_cached(query: str) -> list[AddressSuggestionDTO] | None:
    """Get cached result if not expired"""
    if query in _cache:
        result, ts = _cache[query]
        if time.time() - ts < CACHE_TTL:
            return result
        del _cache[query]
    return None


def _set_cached(query: str, result: list[AddressSuggestionDTO]):
    """Store result in cache"""
    _cache[query] = (result, time.time())


@router.get("/suggest", response_model=list[AddressSuggestionDTO])
async def suggest_address(
    query: str = Query(..., min_length=3, description="Address query string")
):
    """
    Get address suggestions from DaData API

    Returns list of address suggestions with coordinates.
    Results are cached for 5 minutes to save API limits.
    """
    # Read API key inside function (after dotenv is loaded)
    api_key = os.getenv("DADATA_API_KEY")
    if not api_key:
        logger.error("DADATA_API_KEY is not configured")
        raise HTTPException(
            status_code=500,
            detail="DaData API key is not configured"
        )

    # Normalize query for cache key
    cache_key = query.lower().strip()

    # Check cache first
    cached = _get_cached(cache_key)
    if cached is not None:
        logger.debug(f"Cache hit for query: {query}")
        return cached

    logger.debug(f"Cache miss for query: {query}, fetching from DaData")

    # Make request to DaData
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                DADATA_API_URL,
                headers={
                    "Authorization": f"Token {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "query": query,
                    "count": 5,
                },
                timeout=5.0,
            )
            response.raise_for_status()
    except httpx.TimeoutException:
        logger.error(f"DaData API timeout for query: {query}")
        raise HTTPException(status_code=504, detail="DaData API timeout")
    except httpx.HTTPStatusError as e:
        logger.error(f"DaData API error: {e.response.status_code}")
        raise HTTPException(status_code=502, detail="DaData API error")
    except Exception as e:
        logger.error(f"DaData request failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch suggestions")

    # Parse response
    data = response.json()
    suggestions = data.get("suggestions", [])

    result = [
        AddressSuggestionDTO(
            value=item.get("value", ""),
            geo_lat=item.get("data", {}).get("geo_lat"),
            geo_lon=item.get("data", {}).get("geo_lon"),
        )
        for item in suggestions
    ]

    # Cache result
    _set_cached(cache_key, result)

    return result
