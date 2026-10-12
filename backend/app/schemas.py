from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class InfoRequest(BaseModel):
    url: str = Field(..., description="Valid YouTube Video or Shorts URL")


class FormatOption(BaseModel):
    format_id: str
    ext: str
    quality_label: str = Field(..., description="e.g. 1080p, 720p, 480p, 360p, or 320kbps")
    type: Literal["video", "audio"]
    resolution: Optional[str] = None
    filesize_approx: Optional[int] = None
    filesize_formatted: Optional[str] = None
    note: Optional[str] = None


class VideoMetadata(BaseModel):
    id: str
    url: str
    title: str
    channel: str
    channel_url: Optional[str] = None
    duration: int
    duration_formatted: str
    view_count: Optional[int] = None
    view_count_formatted: str
    thumbnail: str
    description: Optional[str] = None
    is_live: bool = False
    video_formats: List[FormatOption] = []
    audio_formats: List[FormatOption] = []


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
