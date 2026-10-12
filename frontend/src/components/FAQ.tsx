'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: 'How does 1080p downloading work without losing audio?',
    answer:
      'YouTube delivers 1080p and higher resolutions as separate video and audio streams (DASH adaptive streaming). Our backend utilizes high-speed FFmpeg to mux the highest quality video and audio streams into an optimized MP4 container before streaming to your browser.',
  },
  {
    question: 'Are downloaded files permanently saved on the server?',
    answer:
      'No. The backend operates on an ephemeral streaming pipeline. Media chunks are piped directly to your browser with HTTP Content-Disposition headers. Any temporary muxing buffer is automatically purged immediately upon completion or disconnection.',
  },
  {
    question: 'Can I extract MP3 audio directly at 320kbps?',
    answer:
      'Yes. When you choose Audio (MP3), the backend extracts the purest audio stream and transcodes it to high-definition 320kbps, 192kbps, or 128kbps CBR MP3 with intact tags.',
  },
  {
    question: 'How are YouTube bot-detection blocks and rate limits handled?',
    answer:
      'The backend is powered by native yt-dlp, which receives frequent updates to navigate YouTube cipher changes. It includes built-in rate limiting per IP address, configurable proxy support, and cookie rotation to ensure maximum uptime.',
  },
];

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 border-t border-slate-800/80">
      <h3 className="text-xl sm:text-2xl font-bold text-center text-white mb-8">
        Frequently Asked Questions
      </h3>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="glass-panel rounded-xl border border-slate-800 overflow-hidden transition"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between text-sm sm:text-base font-semibold text-slate-200 hover:text-white transition"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-rose-400' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-4 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/50 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
