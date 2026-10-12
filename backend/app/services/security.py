import re
import urllib.parse
from typing import Optional, Tuple


# Regex pattern to match valid YouTube video IDs (11 alphanumeric, underscore, or hyphen chars)
YOUTUBE_ID_REGEX = re.compile(r"^[a-zA-Z0-9_-]{11}$")

# Permitted hostnames
ALLOWED_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtu.be",
    "music.youtube.com",
    "www.music.youtube.com",
}

# Supported qualities
ALLOWED_VIDEO_QUALITIES = {"1080p", "720p", "480p", "360p", "best"}
ALLOWED_AUDIO_QUALITIES = {"320kbps", "192kbps", "128kbps", "best"}


def extract_youtube_video_id(url: str) -> Optional[str]:
    """
    Parses a YouTube URL, verifies that it points to a legitimate YouTube domain,
    and extracts the 11-character video ID.
    Rejects any SSRF attempts, file schemes, loopbacks, or malicious hosts.
    """
    if not url or not isinstance(url, str):
        return None

    url = url.strip()
    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:
        return None

    if parsed.scheme not in ("http", "https"):
        return None

    hostname = (parsed.hostname or "").lower()
    if hostname not in ALLOWED_HOSTS:
        return None

    video_id: Optional[str] = None

    if hostname == "youtu.be":
        # Format: https://youtu.be/<video_id>
        path_parts = parsed.path.strip("/").split("/")
        if path_parts and path_parts[0]:
            video_id = path_parts[0]
    else:
        # Standard youtube.com URLs
        path = parsed.path.lower()
        if path == "/watch":
            # Format: https://www.youtube.com/watch?v=<video_id>
            query = urllib.parse.parse_qs(parsed.query)
            v_list = query.get("v")
            if v_list and len(v_list) > 0:
                video_id = v_list[0]
        elif path.startswith("/shorts/"):
            # Format: https://www.youtube.com/shorts/<video_id>
            parts = parsed.path.strip("/").split("/")
            if len(parts) >= 2:
                video_id = parts[1]
        elif path.startswith("/embed/"):
            # Format: https://www.youtube.com/embed/<video_id>
            parts = parsed.path.strip("/").split("/")
            if len(parts) >= 2:
                video_id = parts[1]

    if video_id and YOUTUBE_ID_REGEX.match(video_id):
        return video_id

    return None


def sanitize_youtube_url(url: str) -> Tuple[bool, str, Optional[str]]:
    """
    Validates and normalizes YouTube URLs into canonical form:
    https://www.youtube.com/watch?v=<VIDEO_ID>
    Returns: (is_valid, canonical_url_or_error_msg, video_id)
    """
    video_id = extract_youtube_video_id(url)
    if not video_id:
        return (
            False,
            "Invalid YouTube URL. Please provide a valid public YouTube watch, shorts, or youtu.be link.",
            None,
        )

    canonical_url = f"https://www.youtube.com/watch?v={video_id}"
    return True, canonical_url, video_id


def sanitize_filename(filename: str, max_length: int = 120) -> str:
    """
    Strips path traversal elements, illegal characters, and control characters.
    Truncates to safe length.
    """
    # Replace illegal filesystem and header characters with an underscore
    cleaned = re.sub(r'[\/\\:\*\?"<>\|\x00-\x1f]', "_", filename)
    cleaned = cleaned.strip(". ")
    if not cleaned:
        cleaned = "youtube_media"
    return cleaned[:max_length]


def validate_quality(format_type: str, quality: str) -> bool:
    """Ensures requested quality belongs to strict whitelist."""
    if format_type == "video":
        return quality.lower() in ALLOWED_VIDEO_QUALITIES
    elif format_type == "audio":
        return quality.lower() in ALLOWED_AUDIO_QUALITIES
    return False
