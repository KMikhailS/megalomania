import logging
import math
from dataclasses import dataclass
from typing import List, Optional

from .cache import TTLCache
from .client import CDEKClient
from .settings import CDEKSettings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class BoundingBox:
    south: float
    west: float
    north: float
    east: float

    def contains(self, lat: float | None, lon: float | None) -> bool:
        if lat is None or lon is None:
            return False
        return self.south <= lat <= self.north and self.west <= lon <= self.east

    def expand(self, percent: float) -> "BoundingBox":
        lat_delta = (self.north - self.south) * percent
        lon_delta = (self.east - self.west) * percent
        return BoundingBox(
            south=self.south - lat_delta,
            west=self.west - lon_delta,
            north=self.north + lat_delta,
            east=self.east + lon_delta,
        )

    def to_cache_key(self, precision: int = 2) -> str:
        return (
            f"{round(self.south, precision)}_{round(self.west, precision)}_"
            f"{round(self.north, precision)}_{round(self.east, precision)}"
        )


class CDEKDeliveryPointsService:
    def __init__(self, client: CDEKClient, cache: TTLCache, settings: CDEKSettings) -> None:
        self.client = client
        self.cache = cache
        self.settings = settings

    async def get_points_by_bbox(
        self,
        bbox: BoundingBox,
        point_type: Optional[str] = None,
        allowed_cod: Optional[bool] = None,
    ) -> List[dict]:
        expanded_bbox = bbox.expand(0.1)
        cache_key = f"cdek:points:bbox:{expanded_bbox.to_cache_key()}"

        cached = await self.cache.get(cache_key)
        if cached is None:
            points = await self._fetch_points_for_bbox(expanded_bbox)
            await self.cache.set(cache_key, points, ttl=self.settings.points_cache_ttl)
        else:
            points = cached

        return self._filter_points(points, bbox, point_type, allowed_cod)

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
        cities = await self._get_cities_index()
        needle = query.strip().lower()
        if not needle:
            return []

        matches = [
            city for city in cities
            if needle in city["name"].lower()
        ]
        return matches[:limit]

    async def find_nearest_city(self, lat: float, lon: float, max_distance_km: float = 100) -> Optional[dict]:
        """
        Найти ближайший город СДЭК к заданным координатам.
        Возвращает None если ближайший город дальше max_distance_km.
        """
        cities = await self._get_cities_index()
        if not cities:
            return None

        nearest = None
        min_distance = float("inf")

        for city in cities:
            city_lat = city.get("latitude")
            city_lon = city.get("longitude")
            if city_lat is None or city_lon is None:
                continue

            distance = self._haversine_distance(lat, lon, city_lat, city_lon)
            if distance < min_distance:
                min_distance = distance
                nearest = city

        if nearest and min_distance <= max_distance_km:
            return nearest
        return None

    async def warm_up_cities_cache(self) -> None:
        """
        Прогреть кэш городов при старте приложения.
        Вызывается в фоне, чтобы не блокировать запуск.
        """
        logger.info("Starting CDEK cities cache warm-up...")
        try:
            cities = await self._get_cities_index()
            logger.info("CDEK cities cache warmed up with %d cities", len(cities))
        except Exception as exc:
            logger.error("Failed to warm up CDEK cities cache: %s", exc)

    @staticmethod
    def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Расстояние между двумя точками в километрах (формула гаверсинуса)."""
        R = 6371  # Радиус Земли в км

        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)

        a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        return R * c

    async def _fetch_points_for_bbox(self, bbox: BoundingBox) -> List[dict]:
        city_codes = await self._get_cities_in_bbox(bbox)
        if not city_codes:
            return []

        all_points: list[dict] = []
        for city_code in city_codes:
            points = await self._fetch_points_by_city(city_code)
            all_points.extend(points)

        unique_points: dict[str, dict] = {}
        for point in all_points:
            code = point.get("code")
            if code and code not in unique_points:
                unique_points[code] = point

        return [
            p for p in unique_points.values()
            if bbox.contains(
                p["coordinates"]["latitude"],
                p["coordinates"]["longitude"],
            )
        ]

    async def _fetch_points_by_city(self, city_code: int) -> List[dict]:
        cache_key = f"cdek:points:city:{city_code}"
        cached = await self.cache.get(cache_key)
        if cached:
            return cached

        points = await self.client.get("/deliverypoints", params={"city_code": city_code})
        transformed = [self._transform_point(p) for p in points]
        transformed = [
            p for p in transformed
            if p["coordinates"]["latitude"] is not None
            and p["coordinates"]["longitude"] is not None
        ]

        await self.cache.set(cache_key, transformed, ttl=self.settings.points_cache_ttl)
        return transformed

    async def _get_cities_in_bbox(self, bbox: BoundingBox) -> List[int]:
        cities = await self._get_cities_index()
        return [
            city["code"]
            for city in cities
            if bbox.contains(city.get("latitude"), city.get("longitude"))
        ]

    async def _get_cities_index(self) -> List[dict]:
        cache_key = "cdek:cities:index"
        cached = await self.cache.get(cache_key)
        if cached:
            return cached

        cities: list[dict] = []
        seen_codes: set[int] = set()
        page = 0
        size = self.settings.max_points_per_request

        while True:
            raw = await self.client.get(
                "/location/cities",
                params={
                    "country_codes": "RU",
                    "page": page,
                    "size": size,
                },
            )

            if not isinstance(raw, list) or not raw:
                break

            for city in raw:
                latitude = city.get("latitude")
                longitude = city.get("longitude")
                code = city.get("code")
                if latitude is None or longitude is None or code is None:
                    continue
                if code in seen_codes:
                    continue
                seen_codes.add(code)
                cities.append(
                    {
                        "code": code,
                        "name": city.get("city") or city.get("name") or "",
                        "region": city.get("region") or "",
                        "latitude": latitude,
                        "longitude": longitude,
                    }
                )

            if len(raw) < size:
                break
            page += 1
            if page > 200:
                break

        await self.cache.set(cache_key, cities, ttl=self.settings.cities_cache_ttl)
        return cities

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

    def _filter_points(
        self,
        points: List[dict],
        bbox: BoundingBox,
        point_type: Optional[str],
        allowed_cod: Optional[bool],
    ) -> List[dict]:
        result = []
        for point in points:
            coords = point.get("coordinates", {})
            if not bbox.contains(coords.get("latitude"), coords.get("longitude")):
                continue

            if point_type and point.get("type") != point_type:
                continue

            if allowed_cod is not None and point.get("allowed_cod") != allowed_cod:
                continue

            result.append(point)

        return result
