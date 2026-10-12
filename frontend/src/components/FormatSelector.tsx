'use client';

import React from 'react';
import { Film, Music, Download, Check, Sparkles, HardDrive, Volume2 } from 'lucide-react';
import { FormatOption } from '@/lib/types';

interface FormatSelectorProps {
  activeTab: 'video' | 'audio';
  setActiveTab: (tab: 'video' | 'audio') => void;
  videoFormats: FormatOption[];
  audioFormats: FormatOption[];
  selectedQuality: string;
  setSelectedQuality: (q: string) => void;
  onDownload: () => void;
  isDownloading: boolean;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  activeTab,
  setActiveTab,
  videoFormats,
  audioFormats,
  selectedQuality,
  setSelectedQuality,
  onDownload,
  isDownloading,
}) => {
  const currentFormats = activeTab === 'video' ? videoFormats : audioFormats;

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 p-5 sm:p-6 space-y-6">
      {/* Format Category Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 w-full sm:w-auto p-1 bg-surface-900 rounded-xl border border-slate-800">
          <button
            id="tab-video"
            onClick={() => {
              setActiveTab('video');
              const defaultVideo = videoFormats[0]?.quality_label || '720p';
              setSelectedQuality(defaultVideo);
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'video'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white hover:bg-surface-800'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Video (MP4)</span>
          </button>

          <button
            id="tab-audio"
            onClick={() => {
              setActiveTab('audio');
              const defaultAudio = audioFormats[0]?.quality_label || '320kbps';
              setSelectedQuality(defaultAudio);
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'audio'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white hover:bg-surface-800'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Audio (MP3)</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{activeTab === 'video' ? 'Full HD & Muxed Audio' : 'Direct MP3 Transcoding'}</span>
        </div>
      </div>

      {/* Quality Selection Grid */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Select Output Quality:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {currentFormats.map((f) => {
            const isSelected = selectedQuality === f.quality_label;
            const isHD = f.quality_label === '1080p' || f.quality_label === '320kbps';

            return (
              <button
                key={f.format_id}
                onClick={() => setSelectedQuality(f.quality_label)}
                className={`relative flex flex-col justify-between p-4 rounded-xl text-left border transition-all duration-200 ${
                  isSelected
                    ? 'bg-rose-600/10 border-rose-500 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/40'
                    : 'bg-surface-900/80 border-slate-800 hover:border-slate-700 hover:bg-surface-900'
                }`}
              >
                {/* Header of card */}
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-base font-bold text-white flex items-center gap-2">
                    {f.quality_label}
                    {isHD && (
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        BEST
                      </span>
                    )}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                      isSelected
                        ? 'bg-rose-600 border-rose-600 text-white'
                        : 'border-slate-700 text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>

                {/* Sub details */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="uppercase text-[11px] font-medium tracking-wider text-slate-500">Format</span>
                    <span className="text-slate-300 font-semibold">{f.ext.toUpperCase()}</span>
                  </div>

                  {f.filesize_formatted && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <HardDrive className="w-3 h-3" />
                        Size
                      </span>
                      <span className="text-slate-300 font-mono">~{f.filesize_formatted}</span>
                    </div>
                  )}

                  {f.note && (
                    <div className="pt-1 text-[11px] text-slate-400 truncate" title={f.note}>
                      {f.note}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Download Button */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-rose-400" />
          <span>
            Target: <strong className="text-white">{selectedQuality}</strong> ({activeTab.toUpperCase()})
          </span>
        </div>

        <button
          id="start-download-btn"
          onClick={onDownload}
          disabled={isDownloading || !selectedQuality}
          className={`w-full sm:w-auto min-w-[200px] px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all ${
            isDownloading
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:opacity-95 text-white shadow-rose-600/30 active:scale-[0.98]'
          }`}
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>{isDownloading ? 'Preparing Stream...' : `Download ${selectedQuality}`}</span>
        </button>
      </div>
    </div>
  );
};
