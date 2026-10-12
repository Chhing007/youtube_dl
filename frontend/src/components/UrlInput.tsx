'use client';

import React, { useState, useEffect } from 'react';
import { Search, Link as LinkIcon, CheckCircle2, AlertCircle, Clipboard, X, Loader2 } from 'lucide-react';
import { isValidYouTubeUrl } from '@/lib/utils';

interface UrlInputProps {
  url: string;
  setUrl: (val: string) => void;
  onFetch: () => void;
  isLoading: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ url, setUrl, onFetch, isLoading }) => {
  const [touched, setTouched] = useState(false);
  const isValid = isValidYouTubeUrl(url);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setTouched(true);
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  const handleClear = () => {
    setUrl('');
    setTouched(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isValid && !isLoading) {
      onFetch();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-2">
      <div
        className={`relative flex flex-col sm:flex-row items-center p-2 rounded-2xl transition-all duration-300 ${
          url && isValid
            ? 'glass-panel-glow ring-1 ring-rose-500/40'
            : url && touched && !isValid
            ? 'glass-panel ring-1 ring-amber-500/50'
            : 'glass-panel shadow-2xl'
        }`}
      >
        <div className="flex items-center w-full px-3 py-2 gap-3">
          <LinkIcon
            className={`w-5 h-5 shrink-0 transition-colors ${
              url && isValid
                ? 'text-rose-400'
                : url && touched && !isValid
                ? 'text-amber-400'
                : 'text-slate-500'
            }`}
          />
          <input
            id="youtube-url-input"
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setTouched(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Paste YouTube Video or Shorts link (e.g. https://youtu.be/...)"
            className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none"
            disabled={isLoading}
            autoComplete="off"
            spellCheck="false"
          />

          {url ? (
            <button
              onClick={handleClear}
              type="button"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handlePaste}
              type="button"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-surface-800/80 hover:bg-surface-800 rounded-lg border border-slate-700/60 transition"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Paste</span>
            </button>
          )}
        </div>

        <button
          id="fetch-info-btn"
          onClick={onFetch}
          disabled={!isValid || isLoading}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shrink-0 transition-all duration-200 mt-2 sm:mt-0 ${
            isValid && !isLoading
              ? 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-600/30 active:scale-[0.98]'
              : 'bg-surface-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Fetch Info</span>
            </>
          )}
        </button>
      </div>

      {/* Validation feedback bar */}
      <div className="flex items-center justify-between px-3 text-xs">
        {url && touched && isValid ? (
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Valid YouTube URL detected
          </span>
        ) : url && touched && !isValid ? (
          <span className="flex items-center gap-1.5 text-amber-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            Please enter a valid YouTube link (watch, shorts, or youtu.be)
          </span>
        ) : (
          <span className="text-slate-500">Supports regular videos, YouTube Shorts, and Music links</span>
        )}

        <span className="text-slate-500 hidden sm:inline">Press Enter to extract</span>
      </div>
    </div>
  );
};
