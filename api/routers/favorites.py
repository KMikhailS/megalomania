import logging
from fastapi import APIRouter, Depends, HTTPException, status

from auth import verify_telegram_init_data
from database import add_favorite, remove_favorite, good_exists

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.post("/{product_id}")
async def add_favorite_endpoint(
    product_id: int,
    user_id: int = Depends(verify_telegram_init_data)
):
    """
    Add product to favorites for current user

    Requires valid Telegram WebApp initData in Authorization header
    """
    logger.info(f"User {user_id} adding product {product_id} to favorites")

    if not await good_exists(product_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Good with id {product_id} not found"
        )

    try:
        await add_favorite(user_id, product_id)
        return {"success": True}
    except Exception as e:
        logger.error(f"Failed to add favorite: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add favorite"
        )


@router.delete("/{product_id}")
async def remove_favorite_endpoint(
    product_id: int,
    user_id: int = Depends(verify_telegram_init_data)
):
    """
    Remove product from favorites for current user

    Requires valid Telegram WebApp initData in Authorization header
    """
    logger.info(f"User {user_id} removing product {product_id} from favorites")

    try:
        await remove_favorite(user_id, product_id)
        return {"success": True}
    except Exception as e:
        logger.error(f"Failed to remove favorite: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove favorite"
        )

