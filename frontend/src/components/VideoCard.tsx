'use client';

import React, { useState } from 'react';
import { Eye, Clock, User, ExternalLink, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { VideoMetadata } from '@/lib/types';

interface VideoCardProps {
  metadata: VideoMetadata;
}

export const VideoCard: React.FC<VideoCardProps> = ({ metadata }) => {
  const [showFullDesc, setShowFullDesc] = useState(false);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 p-4 sm:p-6 transition-all hover:border-slate-700">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Thumbnail with overlay duration */}
        <div className="relative shrink-0 w-full md:w-72 aspect-video rounded-xl overflow-hidden bg-slate-900 group shadow-lg">
          <img
            src={metadata.thumbnail}
            alt={metadata.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

          {/* Duration Badge */}
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-xs font-semibold text-white border border-white/10">
            <Clock className="w-3 h-3 text-rose-400" />
            <span>{metadata.duration_formatted}</span>
          </div>

          {/* Quick Play External Indicator */}
          <a
            href={metadata.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white hover:bg-rose-600 transition"
            title="Open on YouTube"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Video Information */}
        <div className="flex-1 flex flex-col justify-between space-y-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white line-clamp-2 leading-snug">
              {metadata.title}
            </h2>

            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs sm:text-sm text-slate-400">
              <div className="flex items-center gap-1.5 text-slate-300 bg-surface-900 px-2.5 py-1 rounded-lg border border-slate-800">
                <User className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-medium truncate max-w-[150px]">{metadata.channel}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-surface-900 px-2.5 py-1 rounded-lg border border-slate-800">
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>{metadata.view_count_formatted}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-surface-900 px-2.5 py-1 rounded-lg border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{metadata.duration_formatted}</span>
              </div>
            </div>
          </div>

          {/* Description snippet */}
          {metadata.description && (
            <div className="pt-2 border-t border-slate-800/80">
              <p className={`text-xs text-slate-400 leading-relaxed ${showFullDesc ? '' : 'line-clamp-2'}`}>
                {metadata.description}
              </p>
              {metadata.description.length > 120 && (
                <button
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition"
                >
                  {showFullDesc ? (
                    <>
                      <span>Show less</span>
                      <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      <span>Read more</span>
                      <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
