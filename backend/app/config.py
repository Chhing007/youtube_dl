from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import List, Union, Any
import os
import json
from pathlib import Path


class Settings(BaseSettings):
    PROJECT_NAME: str = "YouTube Downloader API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS settings
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v_trimmed = v.strip()
            if v_trimmed.startswith("[") and v_trimmed.endswith("]"):
                try:
                    return json.loads(v_trimmed)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, tuple)):
            return list(v)
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
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
    YOUTUBE_COOKIES_TEXT: str | None = os.getenv("YOUTUBE_COOKIES_TEXT", None)
    YOUTUBE_PROXY: str | None = os.getenv("YOUTUBE_PROXY", None)

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()

# If cookies are provided as an environment variable text, save them to a file automatically
if settings.YOUTUBE_COOKIES_TEXT and not settings.YOUTUBE_COOKIES_FILE:
    cookie_path = settings.TEMP_DIR / "youtube_cookies.txt"
    cookie_path.parent.mkdir(parents=True, exist_ok=True)
    cookie_path.write_text(settings.YOUTUBE_COOKIES_TEXT, encoding="utf-8")
    settings.YOUTUBE_COOKIES_FILE = str(cookie_path)

# Ensure temp directory exists
settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)

