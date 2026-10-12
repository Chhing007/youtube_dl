from fastapi import HTTPException, status


class YouTubeAppException(HTTPException):
    def __init__(self, status_code: int, detail: str, error_code: str = "ERROR"):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code


class InvalidUrlException(YouTubeAppException):
    def __init__(self, detail: str = "Invalid YouTube URL provided"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="INVALID_URL",
        )


class VideoNotFoundException(YouTubeAppException):
    def __init__(self, detail: str = "Video not found or was removed"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="VIDEO_NOT_FOUND",
        )


class VideoUnavailableException(YouTubeAppException):
    def __init__(self, detail: str = "Video is private, copyright-blocked, or requires sign-in"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="VIDEO_UNAVAILABLE",
        )


class LiveStreamNotSupportedException(YouTubeAppException):
    def __init__(self, detail: str = "Live streams cannot be downloaded until broadcasting completes"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="LIVE_STREAM_UNSUPPORTED",
        )


class VideoTooLongException(YouTubeAppException):
    def __init__(self, detail: str = "Video duration exceeds maximum allowed server limit"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="VIDEO_TOO_LONG",
        )


class YouTubeRateLimitException(YouTubeAppException):
    def __init__(self, detail: str = "YouTube temporarily throttled requests (HTTP 429). Please try again shortly"):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            error_code="YOUTUBE_RATE_LIMITED",
        )
