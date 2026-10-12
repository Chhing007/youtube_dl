from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path


class Settings(BaseSettings):
    PROJECT_NAME: str = "YouTube Downloader API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS settings
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",
    ]

    # Rate Limiting (slowapi syntax)
    RATE_LIMIT_INFO: str = "30/minute"
    RATE_LIMIT_DOWNLOAD: str = "10/minute"

    # Temporary directory for muxing operations
    TEMP_DIR: Path = Path(os.getenv("TEMP_DIR", "./temp_downloads"))

    # Operational guardrails
    MAX_VIDEO_DURATION_SECONDS: int = 14400  # Max 4 hours to avoid infinite streaming
    TEMP_FILE_EXPIRY_SECONDS: int = 600       # 10 minutes auto-cleanup

    # Optional yt-dlp anti-bot configuration
    YOUTUBE_COOKIES_FILE: str | None = os.getenv("YOUTUBE_COOKIES_FILE", None)
    YOUTUBE_PROXY: str | None = os.getenv("YOUTUBE_PROXY", None)

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()

# Ensure temp directory exists
settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)
