import logging
import uuid
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, UploadFile, File

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/shop", tags=["uploads"])

# Upload configuration
UPLOAD_DIR = Path("/app/data/uploads")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/upload")
async def upload_images(images: list[UploadFile] = File(...)):
    """
    Upload multiple product images

    Accepts list of image files (jpg, jpeg, png, webp) up to 5MB each
    Returns list of image URLs for use in product cards
    """
    logger.info(f"Uploading {len(images)} images")

    uploaded_urls = []

    for image in images:
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
                detail=f"File {image.filename} size exceeds 5MB limit"
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
            logger.info(f"Image saved: {filename}")
        except Exception as e:
            logger.error(f"Failed to save image: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save image {image.filename}"
            )

        # Add URL to list (including /api prefix for nginx proxy routing)
        image_url = f"/api/static/{filename}"
        uploaded_urls.append(image_url)

    return {
        "success": True,
        "imageUrls": uploaded_urls
    }
