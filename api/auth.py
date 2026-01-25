import os
import logging
from fastapi import Header, HTTPException, status, Depends
from aiogram.utils.web_app import safe_parse_webapp_init_data
from database import get_user

logger = logging.getLogger(__name__)


async def verify_telegram_init_data(authorization: str = Header(...)) -> int:
    """
    Verify Telegram WebApp initData and extract user_id

    Args:
        authorization: Authorization header in format "tma <initData>"

    Returns:
        int: Telegram user_id

    Raises:
        HTTPException: If authorization is invalid
    """
    # Check authorization header format
    if not authorization or not authorization.startswith("tma "):
        logger.warning("Invalid authorization header format")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )

    # Extract initData from header
    init_data_str = authorization.replace("tma ", "", 1)

    if not init_data_str:
        logger.warning("Empty initData")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Empty initData"
        )

    # Get bot token from environment
    bot_token = os.getenv("BOT_TOKEN")
    if not bot_token:
        logger.error("BOT_TOKEN not found in environment")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error"
        )

    try:
        # Validate initData signature using aiogram
        # safe_parse_webapp_init_data returns WebAppInitData object
        init_data = safe_parse_webapp_init_data(
            token=bot_token,
            init_data=init_data_str
        )

        # Extract user_id
        if not init_data.user:
            logger.warning("No user data in initData")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No user data"
            )

        user_id = init_data.user.id
        logger.info(f"Successfully authenticated user {user_id}")
        return user_id

    except ValueError as e:
        logger.warning(f"Invalid initData signature: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid initData signature"
        )


async def verify_admin_mode(user_id: int = Depends(verify_telegram_init_data)) -> int:
    """
    Verify that user has ADMIN role

    Args:
        user_id: Telegram user_id from verify_telegram_init_data dependency

    Returns:
        int: Telegram user_id

    Raises:
        HTTPException: If user doesn't have ADMIN role
    """
    # Get user from database
    user = await get_user(user_id)

    if not user:
        logger.warning(f"User {user_id} not found in database")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if user has ADMIN role (not mode!)
    if user.get("role") != "ADMIN":
        logger.warning(f"User {user_id} attempted to access ADMIN endpoint with role={user.get('role')}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required"
        )

    logger.info(f"User {user_id} authenticated with ADMIN role")
    return user_id
