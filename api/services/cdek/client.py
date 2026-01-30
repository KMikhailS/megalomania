import httpx

from .auth import CDEKAuthService
from .settings import CDEKSettings


class CDEKClient:
    def __init__(self, settings: CDEKSettings, auth: CDEKAuthService) -> None:
        self.settings = settings
        self.auth = auth

    def _get_base_url(self) -> str:
        return self.settings.test_url if self.settings.use_test else self.settings.base_url

    async def request(self, method: str, path: str, **kwargs):
        url = f"{self._get_base_url()}{path}"
        headers = kwargs.pop("headers", {})

        token = await self.auth.get_token()
        headers["Authorization"] = f"Bearer {token}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(method, url, headers=headers, **kwargs)

            if response.status_code == 401:
                await self.auth.invalidate_token()
                token = await self.auth.get_token()
                headers["Authorization"] = f"Bearer {token}"
                response = await client.request(method, url, headers=headers, **kwargs)

            response.raise_for_status()
            return response.json()

    async def get(self, path: str, params: dict | None = None):
        return await self.request("GET", path, params=params)

    async def post(self, path: str, json: dict | None = None):
        return await self.request("POST", path, json=json)
