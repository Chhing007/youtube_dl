# Multi-stage production Dockerfile for FastAPI + yt-dlp + ffmpeg
FROM python:3.11-slim AS base

# Install system dependencies: ffmpeg for media muxing, nodejs for YouTube JS cipher solving, curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    nodejs \
    curl \
    ca-certificates \
    && (which node || ln -s $(which nodejs) /usr/local/bin/node) \
    && rm -rf /var/lib/apt/lists/*

# Create non-root application user
RUN groupadd -r appgroup && useradd -r -g appgroup -u 1001 appuser

WORKDIR /app

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY . .

# Setup temp directory and permissions
RUN mkdir -p /app/temp_downloads && \
    chown -R appuser:appgroup /app

USER appuser

ENV HOST=0.0.0.0
ENV PORT=8000
ENV TEMP_DIR=/app/temp_downloads
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"]

