import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Robust regex pattern matching all public YouTube URL formats
export const YOUTUBE_URL_REGEX =
  /(?:youtu\.be\/|(?:www\.|m\.|music\.)?youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?(?:.*&)?v=))([a-zA-Z0-9_-]{11})/i;

export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const match = trimmed.match(YOUTUBE_URL_REGEX);
  return match ? match[1] : null;
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}
