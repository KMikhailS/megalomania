from dataclasses import dataclass
import os


def _env_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


def _env_int(value: str | None, default: int) -> int:
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


@dataclass(frozen=True)
class CDEKSettings:
    client_id: str
    client_secret: str
    base_url: str
    test_url: str
    use_test: bool
    sender_city_code: int
    sender_address: str
    default_tariff_code: int
    points_cache_ttl: int
    token_cache_ttl: int
    cities_cache_ttl: int
    max_points_per_request: int

    @staticmethod
    def from_env() -> "CDEKSettings":
        client_id = os.getenv("CDEK_CLIENT_ID")
        client_secret = os.getenv("CDEK_CLIENT_SECRET")

        if not client_id or not client_secret:
            raise ValueError("CDEK_CLIENT_ID or CDEK_CLIENT_SECRET is not configured")

        base_url = os.getenv("CDEK_BASE_URL", "https://api.cdek.ru/v2")
        test_url = os.getenv("CDEK_TEST_URL", "https://api.edu.cdek.ru/v2")
        use_test = _env_bool(os.getenv("CDEK_USE_TEST"), False)
        sender_city_code = _env_int(os.getenv("CDEK_SENDER_CITY_CODE"), 44)
        sender_address = os.getenv("CDEK_SENDER_ADDRESS", "ул. Складская, 1")
        default_tariff_code = _env_int(os.getenv("CDEK_DEFAULT_TARIFF_CODE"), 136)
        points_cache_ttl = _env_int(os.getenv("CDEK_POINTS_CACHE_TTL"), 86400)
        token_cache_ttl = _env_int(os.getenv("CDEK_TOKEN_CACHE_TTL"), 3500)
        cities_cache_ttl = _env_int(os.getenv("CDEK_CITIES_CACHE_TTL"), 86400)
        max_points_per_request = _env_int(os.getenv("CDEK_MAX_POINTS_PER_REQUEST"), 500)

        return CDEKSettings(
            client_id=client_id,
            client_secret=client_secret,
            base_url=base_url,
            test_url=test_url,
            use_test=use_test,
            sender_city_code=sender_city_code,
            sender_address=sender_address,
            default_tariff_code=default_tariff_code,
            points_cache_ttl=points_cache_ttl,
            token_cache_ttl=token_cache_ttl,
            cities_cache_ttl=cities_cache_ttl,
            max_points_per_request=max_points_per_request,
        )
