import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-surface-950/80 py-8 text-center text-xs text-slate-500">
      <div className="max-w-6xl mx-auto px-4 space-y-3">
        <p>
          StreamForge &bull; High-Performance YouTube Video & Audio Processing Suite
        </p>
        <p className="text-[11px] text-slate-600 max-w-xl mx-auto">
          Disclaimer: This application is intended solely for personal backup and educational purposes of authorized or public domain content. Respect creator copyrights and terms of service.
        </p>
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-600 pt-2">
          <span>Next.js 14 App Router</span>
          <span>&bull;</span>
          <span>FastAPI</span>
          <span>&bull;</span>
          <span>yt-dlp Core</span>
          <span>&bull;</span>
          <span>FFmpeg v7</span>
        </div>
      </div>
    </footer>
  );
};
