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
    now = asyncio.get_event_loop().time() if asyncio.get_event_loop().is_running() else 0
    try:
        if not settings.TEMP_DIR.exists():
            return
        for item in settings.TEMP_DIR.iterdir():
            if item.is_file():
                try:
                    file_age = os.path.getmtime(item)
                    import time
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
    Downloads and muxes media using yt-dlp & ffmpeg.
    Returns the real video/audio title for HTTP headers.
    """
    ydl_opts: Dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "outtmpl": str(temp_target_path).replace(".mp4", "") if format_type == "video" else str(temp_target_path).replace(".mp3", ""),
    }

    if settings.YOUTUBE_COOKIES_FILE:
        ydl_opts["cookiefile"] = settings.YOUTUBE_COOKIES_FILE

    if settings.YOUTUBE_PROXY:
        ydl_opts["proxy"] = settings.YOUTUBE_PROXY

    if format_type == "audio":
        # Extract audio and transcode to MP3 with specified bitrate
        bitrate = quality.replace("kbps", "") if "kbps" in quality else "192"
        ydl_opts.update({
            "format": "bestaudio/best",
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": bitrate,
                }
            ],
            "outtmpl": str(temp_target_path).rsplit(".", 1)[0] + ".%(ext)s",
        })
    else:
        # Video with merged audio
        height_str = quality.replace("p", "") if "p" in quality else "720"
        try:
            height = int(height_str)
        except ValueError:
            height = 720

        # Select highest quality video stream at or below requested resolution, merged with best audio
        format_spec = f"bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={height}]+bestaudio/best[height<={height}]/best"
        ydl_opts.update({
            "format": format_spec,
            "merge_output_format": "mp4",
            "outtmpl": str(temp_target_path).rsplit(".", 1)[0] + ".%(ext)s",
        })

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(canonical_url, download=True)
        title = info.get("title", "youtube_video")
        return title


async def prepare_media_download(
    canonical_url: str,
    format_type: str,
    quality: str,
) -> Tuple[Path, str, str, int]:
    """
    Prepares media file using yt-dlp in a background thread.
    Returns: (output_file_path, sanitized_filename, mime_type, file_size)
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
        # Clean up any partial artifacts
        for p in settings.TEMP_DIR.glob(f"{unique_id}.*"):
            cleanup_file_safely(p)
        raise YouTubeAppException(
            status_code=500,
            detail=f"Failed to process and mux media: {str(e)}",
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
