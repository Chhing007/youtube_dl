import os
import re
import urllib.parse
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Query, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.schemas import InfoRequest, VideoMetadata, ErrorResponse
from app.services.security import sanitize_youtube_url, validate_quality
from app.services.youtube import get_video_info
from app.services.streamer import (
    prepare_media_download,
    file_streamer_with_cleanup,
    cleanup_file_safely,
    cleanup_stale_temp_files,
)
from app.exceptions import (
    YouTubeAppException,
    InvalidUrlException,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: clean any orphan files from prior runs
    cleanup_stale_temp_files()
    yield
    # Shutdown
    cleanup_stale_temp_files()


# Rate Limiter setup
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="High-performance backend API for YouTube video & audio extraction",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com|http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Length"],
)


@app.exception_handler(YouTubeAppException)
async def custom_exception_handler(request: Request, exc: YouTubeAppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "error_code": exc.error_code},
    )


@app.get("/", tags=["System"])
async def root():
    """Root landing endpoint providing service status and documentation link."""
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_check": "/api/health",
    }


@app.get("/api/health", tags=["System"])
async def health_check():
    """Returns system status, service health, and dependency versions."""
    import yt_dlp
    import shutil

    ffmpeg_installed = shutil.which("ffmpeg") is not None
    node_installed = shutil.which("node") is not None
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "yt_dlp_version": yt_dlp.version.__version__,
        "ffmpeg_installed": ffmpeg_installed,
        "node_installed": node_installed,
    }


@app.post(
    "/api/info",
    response_model=VideoMetadata,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 429: {"model": ErrorResponse}},
    tags=["YouTube"],
)
@limiter.limit(settings.RATE_LIMIT_INFO)
async def fetch_video_info(request: Request, body: InfoRequest):
    """
    Validates the YouTube URL and extracts video metadata, available formats,
    thumbnails, duration, and approximate file sizes without downloading media.
    """
    is_valid, canonical_url_or_err, _ = sanitize_youtube_url(body.url)
    if not is_valid:
        raise InvalidUrlException(canonical_url_or_err)

    metadata = await get_video_info(canonical_url_or_err)
    return metadata


@app.get(
    "/api/download",
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    tags=["YouTube"],
)
@limiter.limit(settings.RATE_LIMIT_DOWNLOAD)
async def download_media(
    request: Request,
    background_tasks: BackgroundTasks,
    url: str = Query(..., description="YouTube video URL"),
    format: str = Query("video", regex="^(video|audio)$", description="Media format: 'video' or 'audio'"),
    quality: str = Query("720p", description="Resolution (e.g. 1080p, 720p) or Bitrate (e.g. 320kbps, 192kbps)"),
):
    """
    Streams requested video or audio file directly to client with the original video title.
    """
    # 1. Validate & sanitize YouTube URL against SSRF and injection
    is_valid, canonical_url, _ = sanitize_youtube_url(url)
    if not is_valid:
        raise InvalidUrlException(canonical_url)

    # 2. Validate quality against whitelist
    if not validate_quality(format, quality):
        raise YouTubeAppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid quality '{quality}' specified for format '{format}'.",
            error_code="INVALID_QUALITY",
        )

    # 3. Process download with yt-dlp & FFmpeg
    target_file, filename, mime_type, file_size = await prepare_media_download(
        canonical_url=canonical_url,
        format_type=format,
        quality=quality,
    )

    # Encode filename for RFC 5987 / RFC 6266 compliance
    ascii_clean = re.sub(r'[^\x20-\x7E]', '_', filename).strip()
    if not ascii_clean.replace('.', '').strip('_ '):
        ascii_clean = f"media.{'mp3' if format == 'audio' else 'mp4'}"
    encoded_filename = urllib.parse.quote(filename, encoding="utf-8")

    headers = {
        "Content-Disposition": f'attachment; filename="{ascii_clean}"; filename*=UTF-8\'\'{encoded_filename}',
        "Content-Type": mime_type,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
    }

    if file_size and file_size > 0:
        headers["Content-Length"] = str(file_size)

    # Stream from local file and clean up after delivery
    background_tasks.add_task(cleanup_file_safely, target_file)
    return StreamingResponse(
        file_streamer_with_cleanup(target_file),
        media_type=mime_type,
        headers=headers,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
