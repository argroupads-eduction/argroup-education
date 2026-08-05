'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Clapperboard, ExternalLink, Play, Radio, Youtube } from 'lucide-react';
import type { YoutubeChannelPayload, YoutubeVideo } from '@/lib/youtube/types';
import { YOUTUBE_FEED_REVALIDATE_SECONDS } from '@/lib/youtube/fetchChannelVideos';
import { SOCIAL_LINKS } from '@/lib/constants';

const FALLBACK_CHANNEL_URL =
  SOCIAL_LINKS.find((s) => s.platform === 'youtube')?.url ?? 'https://www.youtube.com/@argroupofeducation';

const CLIENT_REFRESH_MS = YOUTUBE_FEED_REVALIDATE_SECONDS * 1000;

function formatPublishedLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function YoutubeChannelSection() {
  const reduceMotion = useReducedMotion();
  const [payload, setPayload] = useState<YoutubeChannelPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

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
          setActiveId((prev) => {
            if (prev && data.videos.some((v) => v.id === prev)) return prev;
            return data.videos[0]?.id ?? null;
          });
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
  const videos = useMemo(() => payload?.videos ?? [], [payload?.videos]);

  const featured: YoutubeVideo | null = useMemo(() => {
    if (!videos.length) return null;
    return videos.find((v) => v.id === activeId) ?? videos[0] ?? null;
  }, [videos, activeId]);

  const episodes = useMemo(() => {
    if (!featured) return videos.slice(0, 9);
    return videos.filter((v) => v.id !== featured.id).slice(0, 9);
  }, [videos, featured]);

  const isLatestUpload = Boolean(featured && videos[0]?.id === featured.id);
  const publishedLabel = featured ? formatPublishedLabel(featured.publishedAt) : '';

  return (
    <section className="youtube-channel-section" aria-labelledby="youtube-channel-title">
      <div className="youtube-channel-section__aurora" aria-hidden />
      <div className="youtube-channel-section__stage-wash" aria-hidden />
      <div className="youtube-channel-section__grain" aria-hidden />

      <div className="youtube-channel-section__inner">
        <motion.header
          className="youtube-channel-section__header"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          viewport={{ once: true }}
        >
          <div className="youtube-channel-section__header-copy">
            <div className="youtube-channel-section__kicker">
              <span className="youtube-channel-section__live-pill">
                <Radio className="h-3.5 w-3.5" aria-hidden />
                Expert talks · MBBS guidance
              </span>
            </div>

            <h2 id="youtube-channel-title" className="youtube-channel-section__title">
              <span className="youtube-channel-section__brand">AR Group of Education</span>
              <span className="youtube-channel-section__title-rest"> on YouTube</span>
            </h2>
            <p className="youtube-channel-section__subtitle">
              Watch latest NEET updates, MBBS admission guidance, and real student journeys from our YouTube
              channel.
            </p>
          </div>

          <div className="youtube-channel-section__header-actions">
            <Link
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="youtube-channel-section__subscribe"
            >
              <Youtube className="h-4 w-4" aria-hidden />
              Subscribe on YouTube
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </motion.header>

        {loading && !payload ? (
          <div className="youtube-channel-section__skeleton" aria-hidden>
            <div className="youtube-channel-section__skeleton-stage" />
            <div className="youtube-channel-section__skeleton-rail" />
          </div>
        ) : null}

        {featured ? (
          <motion.div
            className="youtube-cinema"
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            viewport={{ once: true }}
          >
            <div className="youtube-cinema__stage">
              <div className="youtube-cinema__bezel" aria-hidden>
                <span className="youtube-cinema__bezel-dot" />
                <span className="youtube-cinema__bezel-label">
                  <Clapperboard className="h-3.5 w-3.5" />
                  Now playing
                </span>
                <span className="youtube-cinema__bezel-mark">AR TV</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.a
                  key={featured.id}
                  href={featured.watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="youtube-cinema__screen group"
                  aria-label={`Watch on YouTube: ${featured.title}`}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.35 }}
                >
                  <span className="youtube-cinema__ambient" aria-hidden>
                    <img src={featured.thumbnailUrl} alt="" decoding="async" />
                  </span>
                  <span className="youtube-cinema__phone">
                    <span className="youtube-cinema__screen-glow" aria-hidden />
                    <img
                      src={featured.thumbnailUrl}
                      alt=""
                      className="youtube-cinema__poster"
                      decoding="async"
                    />
                    <span className="youtube-cinema__veil" aria-hidden />
                    <span className="youtube-cinema__play" aria-hidden>
                      <Play className="h-7 w-7 fill-current sm:h-8 sm:w-8" />
                    </span>
                    {isLatestUpload ? (
                      <span className="youtube-cinema__latest">Latest upload</span>
                    ) : null}
                  </span>
                </motion.a>
              </AnimatePresence>

              <div className="youtube-cinema__caption">
                <p className="youtube-cinema__caption-title">{featured.title}</p>
                {publishedLabel ? (
                  <p className="youtube-cinema__caption-meta">{publishedLabel}</p>
                ) : null}
                <Link
                  href={featured.watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="youtube-cinema__watch-btn"
                >
                  <Play className="h-4 w-4 fill-current" aria-hidden />
                  Watch on YouTube
                </Link>
              </div>
            </div>

            {episodes.length ? (
              <aside className="youtube-cinema__rail" aria-label="More episodes">
                <div className="youtube-cinema__rail-head">
                  <p className="youtube-cinema__rail-title">More videos</p>
                </div>
                <div className="youtube-cinema__rail-list">
                  {episodes.map((video, index) => (
                    <button
                      key={video.id}
                      type="button"
                      className="youtube-episode"
                      onClick={() => setActiveId(video.id)}
                      aria-label={`Play on stage: ${video.title}`}
                    >
                      <span className="youtube-episode__index" aria-hidden>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="youtube-episode__thumb-wrap">
                        <img
                          src={video.thumbnailUrl}
                          alt=""
                          className="youtube-episode__thumb"
                          loading="lazy"
                          decoding="async"
                        />
                        <span className="youtube-episode__play" aria-hidden>
                          <Play className="h-3.5 w-3.5 fill-current" />
                        </span>
                      </span>
                      <span className="youtube-episode__body">
                        <span className="youtube-episode__title">{video.title}</span>
                        <span className="youtube-episode__date">
                          {formatPublishedLabel(video.publishedAt) || 'Recent'}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
                <Link
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="youtube-cinema__rail-more"
                >
                  Open full channel
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </aside>
            ) : null}
          </motion.div>
        ) : null}

        {error && !loading ? (
          <motion.div
            className="youtube-channel-section__fallback"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
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
              className="youtube-channel-section__subscribe"
            >
              <Youtube className="h-4 w-4" aria-hidden />
              Browse videos on YouTube
              <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
            </Link>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
