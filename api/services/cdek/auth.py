from datetime import datetime, timedelta
from typing import Optional
import httpx

from .cache import TTLCache
from .settings import CDEKSettings


class CDEKAuthService:
    def __init__(self, settings: CDEKSettings, cache: TTLCache) -> None:
        self.settings = settings
        self.cache = cache
        self._token: Optional[str] = None
        self._expires_at: Optional[datetime] = None

    async def get_token(self) -> str:
        if self._token and self._expires_at and datetime.utcnow() < self._expires_at:
            return self._token

        cached = await self.cache.get("cdek:auth:token")
        if cached:
            token = cached.get("token")
            expires_at_str = cached.get("expires_at")
            if token and expires_at_str:
                try:
                    expires_at = datetime.fromisoformat(expires_at_str)
                except ValueError:
                    expires_at = None
                if expires_at and datetime.utcnow() < expires_at:
                    self._token = token
                    self._expires_at = expires_at
                    return token

        return await self._fetch_new_token()

    async def invalidate_token(self) -> None:
        self._token = None
        self._expires_at = None
        await self.cache.delete("cdek:auth:token")

    async def _fetch_new_token(self) -> str:
        url = f"{self._get_base_url()}/oauth/token"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                data={
                    "grant_type": "client_credentials",
                    "client_id": self.settings.client_id,
                    "client_secret": self.settings.client_secret,
                },
            )
            response.raise_for_status()
            data = response.json()

        self._token = data["access_token"]
        expires_in = int(data.get("expires_in", 3600))
        skew = 60 if expires_in > 120 else 0
        self._expires_at = datetime.utcnow() + timedelta(seconds=expires_in - skew)

        await self.cache.set(
            "cdek:auth:token",
            {
                "token": self._token,
                "expires_at": self._expires_at.isoformat(),
            },
            ttl=expires_in - skew if expires_in - skew > 0 else expires_in,
        )

        return self._token

    def _get_base_url(self) -> str:
        return self.settings.test_url if self.settings.use_test else self.settings.base_url
