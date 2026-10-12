export interface FormatOption {
  format_id: string;
  ext: string;
  quality_label: string; // e.g. "1080p", "720p", "480p", "360p" or "320kbps", "192kbps", "128kbps"
  type: 'video' | 'audio';
  resolution?: string | null;
  filesize_approx?: number | null;
  filesize_formatted?: string | null;
  note?: string | null;
}

export interface VideoMetadata {
  id: string;
  url: string;
  title: string;
  channel: string;
  channel_url?: string | null;
  duration: number;
  duration_formatted: string;
  view_count?: number | null;
  view_count_formatted: string;
  thumbnail: string;
  description?: string | null;
  is_live: boolean;
  video_formats: FormatOption[];
  audio_formats: FormatOption[];
}

export interface ApiError {
  detail: string;
  error_code?: string;
}

export type DownloadStatus = 
  | 'idle'
  | 'validating'
  | 'fetching_info'
  | 'info_ready'
  | 'preparing_download'
  | 'downloading'
  | 'success'
  | 'error';
