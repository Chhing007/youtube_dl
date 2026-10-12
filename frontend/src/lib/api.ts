import axios from 'axios';
import { VideoMetadata, ApiError } from './types';

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'https://youtube-backend-xjiu.onrender.com'
).replace(/\/$/, '');

export async function fetchVideoInfo(youtubeUrl: string): Promise<VideoMetadata> {
  try {
    const response = await axios.post<VideoMetadata>(
      `${API_BASE_URL}/api/info`,
      { url: youtubeUrl },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60s timeout to allow Render free tier instance to wake up
      }
    );
    return response.data;
  } catch (err: any) {
    if (err.response && err.response.data) {
      const errorData = err.response.data as ApiError;
      throw new Error(errorData.detail || 'Failed to fetch video information');
    } else if (err.code === 'ECONNABORTED') {
      throw new Error('Connection timed out. Render backend may still be waking up. Please retry in a few seconds.');
    } else if (err.message && err.message.includes('Network Error')) {
      throw new Error(
        `Cannot connect to backend server (${API_BASE_URL}). If using Render free tier, please wait 30-40 seconds for it to wake up, or verify the backend is online.`
      );
    }
    throw new Error(err.message || 'An unexpected error occurred while fetching video details.');
  }
}

export function buildDownloadStreamUrl(url: string, format: 'video' | 'audio', quality: string): string {
  const params = new URLSearchParams({
    url: url.trim(),
    format,
    quality,
  });
  return `${API_BASE_URL}/api/download?${params.toString()}`;
}

export async function initiateDirectDownload(
  url: string,
  format: 'video' | 'audio',
  quality: string,
  onProgress?: (percentage: number, loadedBytes: number, totalBytes: number) => void
): Promise<void> {
  const downloadUrl = buildDownloadStreamUrl(url, format, quality);

  try {
    const response = await axios({
      url: downloadUrl,
      method: 'GET',
      responseType: 'blob',
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted, progressEvent.loaded, progressEvent.total);
        } else if (onProgress) {
          onProgress(50, progressEvent.loaded, progressEvent.loaded);
        }
      },
      timeout: 300000, // 5 minutes timeout for large video streams
    });

    // Extract filename from Content-Disposition header if available
    let filename = `download_${Date.now()}.${format === 'audio' ? 'mp3' : 'mp4'}`;
    const disposition = response.headers['content-disposition'];
    if (disposition) {
      const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      if (utf8Match && utf8Match[1]) {
        filename = decodeURIComponent(utf8Match[1]);
      } else {
        const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
        if (asciiMatch && asciiMatch[1]) {
          filename = asciiMatch[1];
        }
      }
    }

    // Create object URL and invoke download
    const blob = new Blob([response.data]);
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err: any) {
    if (err.response && err.response.data) {
      // If error returned as blob, convert to text
      const blob = err.response.data;
      if (blob instanceof Blob) {
        const text = await blob.text();
        try {
          const parsed = JSON.parse(text);
          throw new Error(parsed.detail || 'Download processing failed.');
        } catch {
          throw new Error(text || 'Download failed.');
        }
      }
    }
    throw new Error(err.message || 'Stream download interrupted.');
  }
}
