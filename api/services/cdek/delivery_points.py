import logging
from typing import List, Optional

from .cache import TTLCache
from .client import CDEKClient
from .settings import CDEKSettings

logger = logging.getLogger(__name__)


class CDEKDeliveryPointsService:
    def __init__(self, client: CDEKClient, cache: TTLCache, settings: CDEKSettings) -> None:
        self.client = client
        self.cache = cache
        self.settings = settings

    async def get_points_by_city(
        self,
        city_code: int,
        point_type: Optional[str] = None,
        allowed_cod: Optional[bool] = None,
    ) -> List[dict]:
        """Get delivery points for a specific city."""
        points = await self._fetch_points_by_city(city_code)
        return self._filter_points_by_type(points, point_type, allowed_cod)

    async def get_points_by_coordinates(
        self,
        lat: float,
        lon: float,
        point_type: Optional[str] = None,
        allowed_cod: Optional[bool] = None,
    ) -> List[dict]:
        """Get delivery points by finding the nearest city to coordinates."""
        city = await self._find_city_by_coordinates(lat, lon)
        if not city:
            logger.warning(f"No city found for coordinates lat={lat}, lon={lon}")
            return []

        logger.info(f"Found city {city['name']} (code={city['code']}) for coordinates lat={lat}, lon={lon}")
        points = await self._fetch_points_by_city(city["code"])
        return self._filter_points_by_type(points, point_type, allowed_cod)

    async def _find_city_by_coordinates(self, lat: float, lon: float) -> Optional[dict]:
        """Find the nearest CDEK city by coordinates."""
        # Round coordinates to reduce cache keys
        cache_key = f"cdek:city:coords:{round(lat, 2)}:{round(lon, 2)}"
        cached = await self.cache.get(cache_key)
        if cached:
            return cached

        try:
            # Get cities and find the nearest one
            raw = await self.client.get(
                "/location/cities",
                params={
                    "country_codes": "RU",
                    "size": 1000,
                },
            )

            if not isinstance(raw, list) or not raw:
                return None

            # Find nearest city by distance
            nearest_city = None
            min_distance = float("inf")

            for city in raw:
                city_lat = city.get("latitude")
                city_lon = city.get("longitude")
                if city_lat is None or city_lon is None:
                    continue

                # Simple distance calculation (good enough for finding nearest)
                dist = ((lat - city_lat) ** 2 + (lon - city_lon) ** 2) ** 0.5
                if dist < min_distance:
                    min_distance = dist
                    nearest_city = {
                        "code": city.get("code"),
                        "name": city.get("city") or city.get("name") or "",
                        "region": city.get("region") or "",
                        "latitude": city_lat,
                        "longitude": city_lon,
                    }

            if nearest_city:
                await self.cache.set(cache_key, nearest_city, ttl=self.settings.cities_cache_ttl)

            return nearest_city

        except Exception as e:
            logger.error(f"Error finding city by coordinates: {e}")
            return None

    async def get_point_by_code(self, code: str) -> Optional[dict]:
        cache_key = f"cdek:points:code:{code}"
        cached = await self.cache.get(cache_key)
        if cached:
            return cached

        result = await self.client.get("/deliverypoints", params={"code": code})

        point = None
        if isinstance(result, list) and result:
            point = self._transform_point(result[0])
        elif isinstance(result, dict) and result.get("code"):
            point = self._transform_point(result)

        if point:
            await self.cache.set(cache_key, point, ttl=self.settings.points_cache_ttl)
        return point

    async def search_cities(self, query: str, limit: int = 10) -> List[dict]:
        """Search cities from CDEK API with pagination limit."""
        needle = query.strip().lower()
        if not needle:
            return []

        # Use CDEK API search directly for better performance
        try:
            raw = await self.client.get(
                "/location/cities",
                params={
                    "country_codes": "RU",
                    "city": query,
                    "size": min(limit, 50),
                },
            )
            if not isinstance(raw, list):
                return []

            cities = [
                {
                    "code": city.get("code"),
                    "name": city.get("city") or city.get("name") or "",
                    "region": city.get("region") or "",
                    "latitude": city.get("latitude"),
                    "longitude": city.get("longitude"),
                }
                for city in raw
                if city.get("code")
            ][:limit]

            logger.info(f"Search cities '{query}': found {len(cities)} cities")
            for c in cities[:3]:
                logger.info(f"  - {c['name']} (code={c['code']}, region={c['region']})")

            return cities
        except Exception as e:
            logger.error(f"Error searching cities: {e}")
            return []

    async def _fetch_points_by_city(self, city_code: int) -> List[dict]:
        """Fetch all delivery points for a specific city (cached)."""
        cache_key = f"cdek:points:city:{city_code}"
        cached = await self.cache.get(cache_key)
        if cached:
            logger.info(f"Cache hit for city_code={city_code}, points={len(cached)}")
            return cached

        logger.info(f"Fetching delivery points for city_code={city_code}")
        points: list[dict] = []
        page = 0
        size = 500

        while page < 20:  # Max 20 pages per city
            try:
                raw = await self.client.get(
                    "/deliverypoints",
                    params={
                        "city_code": city_code,
                        "page": page,
                        "size": size,
                    },
                )

                logger.info(f"Page {page}: got {len(raw) if isinstance(raw, list) else 0} points")

                if not isinstance(raw, list) or not raw:
                    break

                for point in raw:
                    transformed = self._transform_point(point)
                    if (
                        transformed["coordinates"]["latitude"] is not None
                        and transformed["coordinates"]["longitude"] is not None
                    ):
                        points.append(transformed)

                if len(raw) < size:
                    break
                page += 1

            except Exception as e:
                logger.error(f"Error fetching points: {e}")
                break

        logger.info(f"Total points for city_code={city_code}: {len(points)}")
        await self.cache.set(cache_key, points, ttl=self.settings.points_cache_ttl)
        return points

    def _transform_point(self, raw: dict) -> dict:
        location = raw.get("location", {})
        latitude = location.get("latitude") or raw.get("latitude")
        longitude = location.get("longitude") or raw.get("longitude")

        return {
            "code": raw.get("code"),
            "name": raw.get("name", ""),
            "type": raw.get("type"),
            "address": location.get("address", ""),
            "address_full": location.get("address_full", ""),
            "city_code": location.get("city_code"),
            "coordinates": {
                "latitude": latitude,
                "longitude": longitude,
            },
            "work_time": raw.get("work_time", ""),
            "work_time_list": raw.get("work_time_list", []),
            "phones": raw.get("phones", []),
            "email": raw.get("email"),
            "note": raw.get("note"),
            "have_cashless": raw.get("have_cashless", False),
            "have_cash": raw.get("have_cash", False),
            "allowed_cod": raw.get("allowed_cod", False),
            "is_dressing_room": raw.get("is_dressing_room", False),
            "is_handout": raw.get("is_handout", True),
            "weight_max": raw.get("weight_max"),
            "weight_min": raw.get("weight_min"),
            "dimensions": raw.get("dimensions"),
        }

    def _filter_points_by_type(
        self,
        points: List[dict],
        point_type: Optional[str],
        allowed_cod: Optional[bool],
    ) -> List[dict]:
        """Filter points by type and allowed_cod."""
        if point_type is None and allowed_cod is None:
            return points

        result = []
        for point in points:
            if point_type and point.get("type") != point_type:
                continue
            if allowed_cod is not None and point.get("allowed_cod") != allowed_cod:
                continue
            result.append(point)

        return result
