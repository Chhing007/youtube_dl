'use client';

import React from 'react';
import { Loader2, CheckCircle2, AlertTriangle, ArrowDownCircle, RefreshCw } from 'lucide-react';

interface DownloadStatusProps {
  status: 'idle' | 'validating' | 'fetching_info' | 'info_ready' | 'preparing_download' | 'downloading' | 'success' | 'error';
  progressPercent: number;
  errorMessage: string | null;
  onRetry?: () => void;
  format: 'video' | 'audio';
  quality: string;
}

export const DownloadStatus: React.FC<DownloadStatusProps> = ({
  status,
  progressPercent,
  errorMessage,
  onRetry,
  format,
  quality,
}) => {
  if (status === 'idle' || status === 'info_ready') return null;

  return (
    <div className="w-full max-w-3xl mx-auto my-4 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
      {status === 'preparing_download' && (
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 flex items-center gap-4 bg-surface-900/90 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
            <Loader2 className="w-5 h-5 text-rose-500 animate-spin" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white">Muxing media on server...</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Merging video streams and highest-fidelity audio into {quality} ({format.toUpperCase()}). Stream will begin automatically.
            </p>
          </div>
        </div>
      )}

      {status === 'downloading' && (
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 space-y-3 bg-surface-900/90 shadow-xl">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-white flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-rose-400 animate-bounce" />
              Streaming file to browser...
            </span>
            <span className="font-mono text-rose-400 font-bold">{progressPercent}%</span>
          </div>

          <div className="w-full h-2.5 bg-surface-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-rose-600 to-amber-500 rounded-full transition-all duration-200"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Direct HTTP Chunked Transfer</span>
            <span>Do not close this tab</span>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 flex items-center gap-4 bg-emerald-950/20 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-emerald-300">Download Complete!</h4>
            <p className="text-xs text-emerald-400/80 mt-0.5">
              Your file ({quality} {format.toUpperCase()}) was streamed directly to your browser's default downloads folder.
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-rose-950/20 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/30">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-rose-300">Processing Interrupted</h4>
              <p className="text-xs text-rose-200/70 mt-0.5">{errorMessage || 'Unable to download this video.'}</p>
            </div>
          </div>

          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 flex items-center gap-1.5 transition self-end sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
