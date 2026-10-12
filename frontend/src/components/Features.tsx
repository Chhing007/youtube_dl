import React from 'react';
import { Cpu, ShieldCheck, Zap, HardDrive, Music, Video } from 'lucide-react';

export const Features: React.FC = () => {
  const items = [
    {
      icon: Cpu,
      title: 'Lossless FFmpeg Muxing',
      description: 'Merges YouTube separate 1080p DASH video & high-bitrate audio tracks into a clean, single MP4 container.',
      color: 'text-rose-400',
    },
    {
      icon: Music,
      title: '320kbps Studio Audio',
      description: 'Converts native audio streams to high-definition 320kbps MP3 with full ID3 metadata and album art.',
      color: 'text-amber-400',
    },
    {
      icon: HardDrive,
      title: 'Direct Stream Pipeline',
      description: 'Files stream chunk-by-chunk to your browser with HTTP Content-Disposition headers. Zero permanent server disk hoarding.',
      color: 'text-emerald-400',
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise Security & SSRF Defense',
      description: 'Strict URL parsing, domain whitelisting, command injection defense, and IP rate limiting built-in.',
      color: 'text-sky-400',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 border-t border-slate-800/80">
      <div className="text-center mb-12">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Engineered for Pure Performance
        </h3>
        <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
          Combining the power of Python's native yt-dlp extractor, FFmpeg transcoding, and FastAPI streaming.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-slate-700 hover:-translate-y-1 transition duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-900 border border-slate-800 flex items-center justify-center mb-4 group-hover:border-rose-500/40 transition">
                <Icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <h4 className="text-base font-bold text-white mb-2">{item.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
