'use client';

import React, { useEffect, useState } from 'react';
import { Youtube, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export const Header: React.FC = () => {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/health`, { method: 'GET' });
        if (res.ok) setApiOnline(true);
        else setApiOnline(false);
      } catch {
        setApiOnline(false);
      }
    };
    checkHealth();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-surface-950/70 border-b border-slate-800/80">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 p-0.5 shadow-lg shadow-rose-600/30">
            <div className="w-full h-full bg-surface-950 rounded-[10px] flex items-center justify-center">
              <Youtube className="w-5 h-5 text-rose-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                StreamForge
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Lossless YouTube Video & MP3 Streamer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-surface-900 border border-slate-800">
            <span
              className={`w-2 h-2 rounded-full ${
                apiOnline === true
                  ? 'bg-emerald-400 animate-pulse'
                  : apiOnline === false
                  ? 'bg-amber-400'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-slate-300">
              {apiOnline === true
                ? 'Backend Online'
                : apiOnline === false
                ? 'Connecting...'
                : 'Connecting...'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 px-3 py-1 bg-surface-900/60 rounded-full border border-slate-800/60">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>yt-dlp + FFmpeg v7</span>
          </div>
        </div>
      </div>
    </header>
  );
};
