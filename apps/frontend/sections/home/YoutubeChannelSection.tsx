'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ExternalLink, Radio, Youtube } from 'lucide-react';
import type { YoutubeChannelPayload } from '@/lib/youtube/types';
import { YOUTUBE_FEED_REVALIDATE_SECONDS } from '@/lib/youtube/fetchChannelVideos';
import { SOCIAL_LINKS } from '@/lib/constants';
import { YoutubeVideoCard } from './YoutubeVideoCard';
import { YoutubeVideoMarquee } from './YoutubeVideoMarquee';

const FALLBACK_CHANNEL_URL =
  SOCIAL_LINKS.find((s) => s.platform === 'youtube')?.url ?? 'https://www.youtube.com/@argroupofeducation';

const CLIENT_REFRESH_MS = YOUTUBE_FEED_REVALIDATE_SECONDS * 1000;

export function YoutubeChannelSection() {
  const [payload, setPayload] = useState<YoutubeChannelPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadVideos = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const res = await fetch(`/api/youtube/videos?_=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      if (res.ok) {
        const data = (await res.json()) as YoutubeChannelPayload;
        if (data.videos?.length) {
          setPayload(data);
          setError(false);
        } else {
          setError(true);
        }
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVideos();

    const interval = window.setInterval(() => {
      void loadVideos({ silent: true });
    }, CLIENT_REFRESH_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadVideos({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadVideos]);

  const channelUrl = payload?.channelUrl ?? FALLBACK_CHANNEL_URL;
  const latestVideo = payload?.videos[0];
  const marqueeVideos = payload?.videos ?? [];

  return (
    <section className="youtube-channel-section" aria-labelledby="youtube-channel-title">
      <div className="youtube-channel-section__aurora" aria-hidden />
      <div className="youtube-channel-section__halo" aria-hidden />
      <div className="youtube-channel-section__shimmer" aria-hidden />
      <div className="youtube-channel-section__glow" aria-hidden />
      <div className="youtube-channel-section__grid" aria-hidden />
      <div className="youtube-channel-section__grain" aria-hidden />
      <div className="youtube-channel-section__vignette" aria-hidden />

      <div className="max-w-7xl mx-auto min-w-0 px-4 sm:px-6 relative z-10">
        <motion.div
          className="youtube-channel-section__header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="youtube-channel-section__live-pill">
            <Radio className="h-3.5 w-3.5" aria-hidden />
            <span>Live from our channel</span>
          </div>

          <h2 id="youtube-channel-title" className="youtube-channel-section__title">
            AR Group Of Education on <span className="text-[#ff3b3b]">YouTube</span>
          </h2>
          <p className="youtube-channel-section__subtitle">Watch real student journeys and get expert insights on your medical career. Latest uploads appear here</p>

          <div className="youtube-channel-section__meta">
            <Link
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="program-hub-btn-primary inline-flex items-center gap-2 text-sm"
            >
              <Youtube className="h-4 w-4" aria-hidden />
              Subscribe on YouTube
              <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
            </Link>
          </div>
        </motion.div>

        {latestVideo ? (
          <motion.div
            className="youtube-channel-section__featured"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <YoutubeVideoCard video={latestVideo} variant="featured" isLatest />
          </motion.div>
        ) : null}

        {error && !loading ? (
          <motion.div
            className="youtube-channel-section__fallback"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="youtube-channel-section__fallback-icon" aria-hidden>
              <Youtube className="h-8 w-8" />
            </div>
            <h3 className="youtube-channel-section__fallback-title">Latest videos on our channel</h3>
            <p className="youtube-channel-section__fallback-text">
              MBBS admission guides, real student journeys, and NEET updates — explore our full video library on
              YouTube while we refresh this feed.
            </p>
            <Link
              href={FALLBACK_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="program-hub-btn-primary inline-flex items-center gap-2 text-sm"
            >
              <Youtube className="h-4 w-4" aria-hidden />
              Browse videos on YouTube
              <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
            </Link>
          </motion.div>
        ) : null}

        {loading && !payload ? (
          <div className="youtube-channel-section__skeleton" aria-hidden>
            <div className="youtube-channel-section__skeleton-featured" />
            <div className="youtube-channel-section__skeleton-row" />
          </div>
        ) : null}
      </div>

      {marqueeVideos.length > 1 ? <YoutubeVideoMarquee videos={marqueeVideos} loading={loading} /> : null}
    </section>
  );
}
