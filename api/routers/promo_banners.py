import logging
from pathlib import Path
from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File

from dependencies import verify_admin_mode
from models import PromoBannerDTO
from database import get_promo_banners, get_all_promo_banners, create_promo_banner, delete_promo_banner, update_promo_banner_status, update_promo_banner_link

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/promo", tags=["promo"])

# Upload configuration
UPLOAD_DIR = Path("/app/data/uploads")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.get("", response_model=list[PromoBannerDTO])
async def get_promo():
    """
    Get all promo banners with status NEW (public endpoint)

    No authentication required
    """
    logger.info("Fetching all promo banners with status NEW")

    try:
        # Get promo banners from database
        banners = await get_promo_banners()

        # Convert to DTOs
        return [
            PromoBannerDTO(
                id=banner["id"],
                status=banner["status"],
                display_order=banner["display_order"],
                image_url=banner["image_url"],
                link=banner["link"]
            )
            for banner in banners
        ]
    except Exception as e:
        logger.error(f"Error fetching promo banners: {e}")
        raise


@router.get("/all", response_model=list[PromoBannerDTO])
async def get_all_promo(user_id: int = Depends(verify_admin_mode)):
    """
    Get ALL promo banners (including BLOCKED) (ADMIN only)

    Requires ADMIN mode authentication
    """
    logger.info(f"User {user_id} fetching all promo banners (including BLOCKED)")

    try:
        # Get all promo banners from database
        banners = await get_all_promo_banners()

        # Convert to DTOs
        return [
            PromoBannerDTO(
                id=banner["id"],
                status=banner["status"],
                display_order=banner["display_order"],
                image_url=banner["image_url"],
                link=banner["link"]
            )
            for banner in banners
        ]
    except Exception as e:
        logger.error(f"Error fetching all promo banners: {e}")
        raise


@router.post("", response_model=PromoBannerDTO)
async def create_promo_banner_endpoint(
    image: UploadFile = File(...),
    user_id: int = Depends(verify_admin_mode)
):
    """
    Create a new promo banner by uploading an image (ADMIN only)

    Uploads image and creates a new promo banner record
    Returns created PromoBannerDTO
    """
    logger.info(f"User {user_id} creating new promo banner")

    # Validate file extension
    file_ext = Path(image.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only images are allowed ({', '.join(ALLOWED_EXTENSIONS)})"
        )

    # Validate content type
    if not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed"
        )

    # Read file content
    contents = await image.read()

    # Validate file size
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds 5MB limit"
        )

    # Generate unique filename
    timestamp = int(datetime.now().timestamp())
    unique_id = uuid.uuid4().hex[:8]
    filename = f"{timestamp}-{unique_id}{file_ext}"
    file_path = UPLOAD_DIR / filename

    # Save file
    try:
        with open(file_path, "wb") as f:
            f.write(contents)
        logger.info(f"Promo banner image saved: {filename}")
    except Exception as e:
        logger.error(f"Failed to save promo banner image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save image"
        )

    # Create promo banner record in database
    image_url = f"/api/static/{filename}"
    try:
        banner = await create_promo_banner(image_url)
        logger.info(f"Created promo banner with id={banner['id']}")

        # Return as DTO
        return PromoBannerDTO(
            id=banner["id"],
            status=banner["status"],
            display_order=banner["display_order"],
            image_url=banner["image_url"],
            link=banner["link"]
        )
    except Exception as e:
        logger.error(f"Failed to create promo banner in database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create promo banner"
        )


@router.delete("/{id}")
async def delete_promo_banner_endpoint(
    id: int,
    user_id: int = Depends(verify_admin_mode)
):
    """
    Delete a promo banner (ADMIN only)

    Returns 204 No Content on success
    """
    logger.info(f"User {user_id} deleting promo banner with id={id}")

    try:
        await delete_promo_banner(id)
        return {"message": f"Promo banner {id} deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to delete promo banner: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete promo banner"
        )


@router.put("/{id}/block", response_model=PromoBannerDTO)
async def block_promo_banner_endpoint(
    id: int,
    user_id: int = Depends(verify_admin_mode)
):
    """
    Block a promo banner (set status to BLOCKED) (ADMIN only)

    Returns updated PromoBannerDTO
    """
    logger.info(f"User {user_id} blocking promo banner with id={id}")

    try:
        banner = await update_promo_banner_status(id, "BLOCKED")
        return PromoBannerDTO(
            id=banner["id"],
            status=banner["status"],
            display_order=banner["display_order"],
            image_url=banner["image_url"],
            link=banner["link"]
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to block promo banner: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to block promo banner"
        )


@router.put("/{id}/activate", response_model=PromoBannerDTO)
async def activate_promo_banner_endpoint(
    id: int,
    user_id: int = Depends(verify_admin_mode)
):
    """
    Activate a promo banner (set status to NEW) (ADMIN only)

    Returns updated PromoBannerDTO
    """
    logger.info(f"User {user_id} activating promo banner with id={id}")

    try:
        banner = await update_promo_banner_status(id, "NEW")
        return PromoBannerDTO(
            id=banner["id"],
            status=banner["status"],
            display_order=banner["display_order"],
            image_url=banner["image_url"],
            link=banner["link"]
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to activate promo banner: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to activate promo banner"
        )


@router.put("/{id}/link", response_model=PromoBannerDTO)
async def update_promo_banner_link_endpoint(
    id: int,
    link: int | None = None,
    user_id: int = Depends(verify_admin_mode)
):
    """
    Update promo banner link (product ID) (ADMIN only)

    Returns updated PromoBannerDTO
    """
    logger.info(f"User {user_id} updating link for promo banner with id={id} to {link}")

    try:
        banner = await update_promo_banner_link(id, link)
        return PromoBannerDTO(
            id=banner["id"],
            status=banner["status"],
            display_order=banner["display_order"],
            image_url=banner["image_url"],
            link=banner["link"]
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to update promo banner link: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update promo banner link"
        )
