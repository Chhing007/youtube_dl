"""
YouTube Service - High-performance metadata extraction.
Uses yt-dlp with Node.js runtime and visionos/default client strategies
to reliably extract metadata without requiring browser cookies.
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional
import yt_dlp

from app.config import settings
from app.schemas import VideoMetadata, FormatOption
from app.exceptions import (
    VideoNotFoundException,
    VideoUnavailableException,
    LiveStreamNotSupportedException,
    VideoTooLongException,
    YouTubeRateLimitException,
    YouTubeAppException,
)
from app.services.security import extract_youtube_video_id

logger = logging.getLogger(__name__)


def format_duration(seconds: Optional[int]) -> str:
    """Converts seconds to HH:MM:SS or MM:SS."""
    if not seconds or seconds < 0:
        return "00:00"
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    if h > 0:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"


def format_views(views: Optional[int]) -> str:
    """Converts raw view count into compact format (e.g. 1.2M views)."""
    if views is None:
        return "N/A"
    if views >= 1_000_000_000:
        return f"{views / 1_000_000_000:.1f}B views"
    if views >= 1_000_000:
        return f"{views / 1_000_000:.1f}M views"
    if views >= 1_000:
        return f"{views / 1_000:.1f}K views"
    return f"{views} views"


def format_filesize(bytes_val: Optional[int]) -> Optional[str]:
    """Converts bytes to MB or GB."""
    if not bytes_val or bytes_val <= 0:
        return None
    mb = bytes_val / (1024 * 1024)
    if mb >= 1024:
        return f"{mb / 1024:.2f} GB"
    return f"{mb:.1f} MB"


def get_base_ydl_opts() -> Dict[str, Any]:
    """Base yt-dlp options configured with Node.js runtime for JavaScript challenge solving."""
    opts: Dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "socket_timeout": 20,
        "extract_flat": False,
        "no_color": True,
        "js_runtimes": {"node": {}},
        "cachedir": False,
        "extractor_retries": 3,
    }

    if settings.YOUTUBE_COOKIES_FILE:
        opts["cookiefile"] = settings.YOUTUBE_COOKIES_FILE

    if settings.YOUTUBE_PROXY:
        opts["proxy"] = settings.YOUTUBE_PROXY

    return opts


def _extract_metadata_sync(canonical_url: str) -> Dict[str, Any]:
    """
    Synchronous metadata extraction via yt-dlp.
    Uses modern client strategies that bypass bot detection without cookies.
    """
    base_opts = get_base_ydl_opts()
    base_opts["skip_download"] = True

    # Priority strategies:
    # 1. visionos + default: Most resilient against YouTube bot detection in 2025/2026
    # 2. tv + default: Smart TV client fallback
    # 3. Default yt-dlp client routing
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
                info = ydl.extract_info(canonical_url, download=False)
                if info:
                    return ydl.sanitize_info(info)
        except Exception as e:
            last_error = e
            logger.warning(f"Metadata extraction strategy {strategy} failed: {e}")
            continue

    msg = str(last_error or "Unknown error")
    if "Private video" in msg:
        raise VideoUnavailableException("This video is private or has been removed.")
    elif "HTTP Error 429" in msg or "Too Many Requests" in msg:
        raise YouTubeRateLimitException()
    elif "Video unavailable" in msg or "not found" in msg.lower():
        raise VideoNotFoundException("Video not found or was deleted by creator")
    elif "Premieres in" in msg or "live event" in msg.lower():
        raise LiveStreamNotSupportedException("Upcoming or live streams cannot be downloaded")
    elif "Sign in to confirm" in msg or "bot" in msg.lower():
        raise VideoUnavailableException("YouTube is temporarily blocking requests. Please try again in a moment.")
    else:
        raise YouTubeAppException(status_code=400, detail=f"Failed to fetch video: {msg}")


async def get_video_info(canonical_url: str) -> VideoMetadata:
    """
    Asynchronously extracts metadata and builds available format choices.
    Runs extraction inside a threadpool executor to avoid blocking the event loop.
    """
    video_id = extract_youtube_video_id(canonical_url)
    if not video_id:
        raise VideoNotFoundException("Could not extract video ID from URL")

    info = await asyncio.to_thread(_extract_metadata_sync, canonical_url)

    # Basic validations
    if info.get("is_live"):
        raise LiveStreamNotSupportedException()

    duration = info.get("duration", 0) or 0
    if duration > settings.MAX_VIDEO_DURATION_SECONDS:
        raise VideoTooLongException(
            f"Video duration ({format_duration(duration)}) exceeds the maximum allowed limit of {settings.MAX_VIDEO_DURATION_SECONDS // 3600} hours."
        )

    formats = info.get("formats", [])
    raw_video_heights = set()
    best_audio_bitrate = 128

    # Scan available stream formats
    for f in formats:
        h = f.get("height")
        vcodec = f.get("vcodec")
        if h and vcodec and vcodec != "none":
            raw_video_heights.add(h)
        abr = f.get("abr")
        if abr and abr > best_audio_bitrate:
            best_audio_bitrate = int(abr)

    # If no video heights were found in formats, provide standard defaults
    if not raw_video_heights:
        raw_video_heights = {720, 480, 360}

    # Desired video resolutions
    target_resolutions = [
        ("1080p", 1080),
        ("720p", 720),
        ("480p", 480),
        ("360p", 360),
    ]

    video_formats: List[FormatOption] = []
    max_available_height = max(raw_video_heights) if raw_video_heights else 720
    for label, height in target_resolutions:
        if height <= max_available_height or height in raw_video_heights:
            # Estimate file size: (video bitrate + 128kbps audio) * duration
            bitrate_map = {1080: 3500_000, 720: 2000_000, 480: 1000_000, 360: 500_000}
            est_bitrate = bitrate_map.get(height, 1000_000) + 128_000
            approx_bytes = int((est_bitrate / 8) * duration) if duration > 0 else None

            video_formats.append(
                FormatOption(
                    format_id=f"mp4-{height}",
                    ext="mp4",
                    quality_label=label,
                    type="video",
                    resolution=f"{height}p",
                    filesize_approx=approx_bytes,
                    filesize_formatted=format_filesize(approx_bytes),
                    note="High quality MP4 with merged audio",
                )
            )

    # Standard audio formats
    target_audio = [
        ("320kbps", 320, "High Definition MP3 (320kbps)"),
        ("192kbps", 192, "Standard Quality MP3 (192kbps)"),
        ("128kbps", 128, "Compact Size MP3 (128kbps)"),
    ]

    audio_formats: List[FormatOption] = []
    for label, kbps, note in target_audio:
        approx_bytes = int(((kbps * 1000) / 8) * duration) if duration > 0 else None
        audio_formats.append(
            FormatOption(
                format_id=f"mp3-{kbps}",
                ext="mp3",
                quality_label=label,
                type="audio",
                resolution=None,
                filesize_approx=approx_bytes,
                filesize_formatted=format_filesize(approx_bytes),
                note=note,
            )
        )

    # Select best thumbnail
    thumbnails = info.get("thumbnails", [])
    thumbnail_url = thumbnails[-1].get("url") if thumbnails else info.get("thumbnail", "")

    return VideoMetadata(
        id=info.get("id", video_id),
        url=canonical_url,
        title=info.get("title", "YouTube Video"),
        channel=info.get("uploader", "Unknown Channel"),
        channel_url=info.get("uploader_url"),
        duration=duration,
        duration_formatted=format_duration(duration),
        view_count=info.get("view_count"),
        view_count_formatted=format_views(info.get("view_count")),
        thumbnail=thumbnail_url,
        description=info.get("description", "")[:300] if info.get("description") else None,
        is_live=bool(info.get("is_live")),
        video_formats=video_formats,
        audio_formats=audio_formats,
    )
