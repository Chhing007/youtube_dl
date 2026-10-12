'use client';

import React, { useState } from 'react';
import { Sparkles, Youtube, CheckCircle2, ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { UrlInput } from '@/components/UrlInput';
import { VideoCard } from '@/components/VideoCard';
import { FormatSelector } from '@/components/FormatSelector';
import { DownloadStatus } from '@/components/DownloadStatus';
import { Features } from '@/components/Features';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';
import { fetchVideoInfo, initiateDirectDownload } from '@/lib/api';
import { VideoMetadata, DownloadStatus as StatusType } from '@/lib/types';

export default function Home() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<StatusType>('idle');
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFetchInfo = async () => {
    if (!url.trim()) return;
    setStatus('fetching_info');
    setErrorMessage(null);

    try {
      const data = await fetchVideoInfo(url.trim());
      setMetadata(data);
      setStatus('info_ready');

      // Set default quality based on current tab
      if (activeTab === 'video') {
        const topVideo = data.video_formats.find((f) => f.quality_label === '1080p') ||
          data.video_formats.find((f) => f.quality_label === '720p') ||
          data.video_formats[0];
        if (topVideo) setSelectedQuality(topVideo.quality_label);
      } else {
        const topAudio = data.audio_formats.find((f) => f.quality_label === '320kbps') ||
          data.audio_formats[0];
        if (topAudio) setSelectedQuality(topAudio.quality_label);
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to fetch video details.');
    }
  };

  const handleDownload = async () => {
    if (!metadata || !selectedQuality) return;
    setStatus('preparing_download');
    setErrorMessage(null);
    setProgressPercent(0);

    try {
      await initiateDirectDownload(
        metadata.url,
        activeTab,
        selectedQuality,
        metadata.title,
        (percent) => {
          setStatus('downloading');
          setProgressPercent(percent);
        }
      );
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Download failed or connection was reset.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10 sm:py-16 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>High-Performance Streaming Pipeline</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Download YouTube Videos &amp; MP3 in{' '}
            <span className="bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
              Ultra High Definition
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Convert public YouTube videos to Full HD MP4 (1080p, 720p) or studio-quality MP3 (320kbps) with direct HTTP chunked streaming and zero server disk accumulation.
          </p>
        </div>

        {/* Input Interface */}
        <section aria-label="URL Input Form">
          <UrlInput
            url={url}
            setUrl={setUrl}
            onFetch={handleFetchInfo}
            isLoading={status === 'fetching_info'}
          />
        </section>

        {/* Status / Progress / Error Display */}
        <DownloadStatus
          status={status}
          progressPercent={progressPercent}
          errorMessage={errorMessage}
          onRetry={handleDownload}
          format={activeTab}
          quality={selectedQuality}
        />

        {/* Video Metadata Preview & Format Selection */}
        {metadata && (
          <section
            aria-label="Video Configuration"
            className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <VideoCard metadata={metadata} />

            <FormatSelector
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                if (tab === 'video') {
                  const defaultVideo = metadata.video_formats[0]?.quality_label || '720p';
                  setSelectedQuality(defaultVideo);
                } else {
                  const defaultAudio = metadata.audio_formats[0]?.quality_label || '320kbps';
                  setSelectedQuality(defaultAudio);
                }
              }}
              videoFormats={metadata.video_formats}
              audioFormats={metadata.audio_formats}
              selectedQuality={selectedQuality}
              setSelectedQuality={setSelectedQuality}
              onDownload={handleDownload}
              isDownloading={status === 'preparing_download' || status === 'downloading'}
            />
          </section>
        )}

        {/* Features Grid */}
        <Features />

        {/* FAQ Section */}
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
