from typing import Optional

from .client import CDEKClient
from .delivery_points import CDEKDeliveryPointsService
from .settings import CDEKSettings


class CDEKCalculatorService:
    def __init__(
        self,
        client: CDEKClient,
        points_service: CDEKDeliveryPointsService,
        settings: CDEKSettings,
    ) -> None:
        self.client = client
        self.points_service = points_service
        self.settings = settings

    async def calculate(
        self,
        delivery_point_code: str,
        weight: int,
        dimensions: dict,
        declared_value: Optional[float] = None,
    ) -> dict:
        city_code = await self._get_city_code_by_point(delivery_point_code)
        payload = {
            "tariff_code": self.settings.default_tariff_code,
            "from_location": {
                "code": self.settings.sender_city_code,
            },
            "to_location": {
                "code": city_code,
            },
            "packages": [
                {
                    "weight": weight,
                    "length": dimensions["length"],
                    "width": dimensions["width"],
                    "height": dimensions["height"],
                }
            ],
        }

        if declared_value and declared_value > 0:
            payload["services"] = [
                {"code": "INSURANCE", "parameter": str(int(declared_value))}
            ]

        result = await self.client.post("/calculator/tariff", json=payload)

        return {
            "delivery_sum": result["delivery_sum"],
            "period_min": result["period_min"],
            "period_max": result["period_max"],
            "total_sum": result.get("total_sum", result["delivery_sum"]),
            "currency": result.get("currency", "RUB"),
            "tariff_code": self.settings.default_tariff_code,
            "tariff_name": result.get("tariff_name"),
            "services": result.get("services", []),
        }

    async def _get_city_code_by_point(self, point_code: str) -> int:
        point = await self.points_service.get_point_by_code(point_code)
        if not point:
            raise ValueError("Delivery point not found")
        city_code = point.get("city_code")
        if city_code is None:
            raise ValueError("Delivery point city code not found")
        return city_code
