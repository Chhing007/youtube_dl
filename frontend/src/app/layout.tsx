import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'StreamForge - Modern High-Speed YouTube Video & MP3 Downloader',
  description:
    'Download public YouTube videos in Full HD (1080p, 720p) and crystal-clear MP3 audio (320kbps) with direct streaming, zero permanent disk storage, and lightning-fast muxing.',
  keywords: ['youtube downloader', 'mp4 download', 'mp3 320kbps', 'youtube to mp3', 'yt-dlp', 'ffmpeg streaming'],
  authors: [{ name: 'Cloud Architecture Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-rose-500 selection:text-white">
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          {/* Ambient lighting gradients */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-rose-600/15 blur-[140px] rounded-full" />
          <div className="absolute top-[30%] -left-40 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full" />
          <div className="absolute bottom-10 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full" />
        </div>
        {children}
      </body>
    </html>
  );
}
