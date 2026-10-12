"""
Streamer Service - High-performance download and muxing pipeline.
Uses yt-dlp with Node.js runtime and visionos/default client strategies
to reliably download video and audio without bot detection or cookie dependencies.
"""
import asyncio
import os
import uuid
import logging
from pathlib import Path
from typing import AsyncGenerator, Dict, Any, Tuple
import yt_dlp
import aiofiles

from app.config import settings
from app.services.security import sanitize_filename
from app.exceptions import YouTubeAppException

logger = logging.getLogger(__name__)


def cleanup_file_safely(file_path: Path):
    """Deletes temporary file if it exists, catching any OS exceptions."""
    try:
        if file_path.exists():
            file_path.unlink()
            logger.info(f"Cleaned up temporary file: {file_path}")
    except Exception as e:
        logger.warning(f"Failed to delete temp file {file_path}: {e}")


def cleanup_stale_temp_files():
    """Removes temporary files older than TEMP_FILE_EXPIRY_SECONDS."""
    try:
        if not settings.TEMP_DIR.exists():
            return
        import time
        for item in settings.TEMP_DIR.iterdir():
            if item.is_file():
                try:
                    file_age = os.path.getmtime(item)
                    if time.time() - file_age > settings.TEMP_FILE_EXPIRY_SECONDS:
                        item.unlink()
                        logger.info(f"Purged expired temp file: {item}")
                except Exception:
                    pass
    except Exception as e:
        logger.warning(f"Error purging stale temp files: {e}")


async def file_streamer_with_cleanup(file_path: Path, chunk_size: int = 65536) -> AsyncGenerator[bytes, None]:
    """
    Streams file contents in chunks to client.
    Guarantees deletion in finally block even if client disconnects mid-transfer.
    """
    try:
        async with aiofiles.open(file_path, mode="rb") as f:
            while True:
                chunk = await f.read(chunk_size)
                if not chunk:
                    break
                yield chunk
    finally:
        cleanup_file_safely(file_path)


def _download_and_mux_sync(
    canonical_url: str,
    format_type: str,
    quality: str,
    temp_target_path: Path,
) -> str:
    """
    Synchronously downloads and muxes media using yt-dlp & ffmpeg.
    Returns the real video/audio title for HTTP headers.
    """
    base_opts: Dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "socket_timeout": 30,
        "retries": 5,
        "fragment_retries": 5,
        "js_runtimes": {"node": {}},
        "cachedir": False,
        "no_color": True,
    }

    if settings.YOUTUBE_COOKIES_FILE:
        base_opts["cookiefile"] = settings.YOUTUBE_COOKIES_FILE

    if settings.YOUTUBE_PROXY:
        base_opts["proxy"] = settings.YOUTUBE_PROXY

    outtmpl_base = str(temp_target_path).rsplit(".", 1)[0] + ".%(ext)s"

    if format_type == "audio":
        bitrate = quality.replace("kbps", "") if "kbps" in quality else "192"
        base_opts.update({
            "format": "bestaudio/best",
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": bitrate,
                }
            ],
            "outtmpl": outtmpl_base,
        })
    else:
        height_str = quality.replace("p", "") if "p" in quality else "720"
        try:
            height = int(height_str)
        except ValueError:
            height = 720

        format_spec = (
            f"bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/"
            f"bestvideo[height<={height}]+bestaudio/"
            f"best[height<={height}]/"
            f"best"
        )
        base_opts.update({
            "format": format_spec,
            "merge_output_format": "mp4",
            "outtmpl": outtmpl_base,
        })

    # Client strategies that bypass YouTube bot detection
    client_strategies = [
        {"player_client": ["visionos", "default"]},
        {"player_client": ["tv", "default"]},
        None,
    ]

    last_error = None
    for strategy in client_strategies:
        try:
            opts = dict(base_opts)
            if strategy:
                opts["extractor_args"] = {"youtube": strategy}
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(canonical_url, download=True)
                title = info.get("title", "youtube_video") if info else "youtube_video"
                return title
        except Exception as e:
            last_error = e
            logger.warning(f"Download strategy {strategy} failed: {e}")
            continue

    if last_error:
        raise last_error
    raise Exception("Download failed with all client strategies")


async def prepare_media_download(
    canonical_url: str,
    format_type: str,
    quality: str,
) -> Tuple[Path, str, str, int]:
    """
    Downloads and prepares media file for client streaming.
    Returns: (output_file_path, filename, mime_type, file_size)
    """
    unique_id = str(uuid.uuid4())
    ext = "mp3" if format_type == "audio" else "mp4"
    target_base = settings.TEMP_DIR / f"{unique_id}.{ext}"

    try:
        title = await asyncio.to_thread(
            _download_and_mux_sync,
            canonical_url,
            format_type,
            quality,
            target_base,
        )
    except Exception as e:
        for p in settings.TEMP_DIR.glob(f"{unique_id}.*"):
            cleanup_file_safely(p)

        error_msg = str(e)
        logger.error(f"Download processing failed for {canonical_url}: {error_msg}")

        if "Sign in to confirm" in error_msg or "bot" in error_msg.lower():
            raise YouTubeAppException(
                status_code=503,
                detail="YouTube anti-bot verification triggered. Please retry in a few moments.",
                error_code="YOUTUBE_BOT_DETECTED",
            )
        raise YouTubeAppException(
            status_code=500,
            detail=f"Failed to process media: {error_msg}",
            error_code="PROCESSING_FAILED",
        )

    # Locate generated output file
    generated_file = None
    for candidate in settings.TEMP_DIR.glob(f"{unique_id}.*"):
        if candidate.is_file():
            generated_file = candidate
            break

    if not generated_file or not generated_file.exists():
        raise YouTubeAppException(
            status_code=500,
            detail="Processing completed but target file was not found",
            error_code="OUTPUT_FILE_MISSING",
        )

    file_size = generated_file.stat().st_size
    clean_title = sanitize_filename(title)
    filename = f"{clean_title}.{ext}"
    mime_type = "audio/mpeg" if ext == "mp3" else "video/mp4"

    return generated_file, filename, mime_type, file_size
