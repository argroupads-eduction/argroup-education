'use client';

import { useCallback, useMemo, useState } from 'react';
import type { YoutubeVideo } from '@/lib/youtube/types';
import { YoutubeVideoCard } from './YoutubeVideoCard';

const CARD_CLASS = 'youtube-marquee-item';

type YoutubeVideoMarqueeProps = {
  videos: YoutubeVideo[];
  loading?: boolean;
};

export function YoutubeVideoMarquee({ videos, loading = false }: YoutubeVideoMarqueeProps) {
  const [paused, setPaused] = useState(false);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  const loopItems = useMemo(() => [...videos, ...videos], [videos]);
  const durationSec = Math.max(48, Math.min(180, videos.length * 5.5));

  if (!videos.length) return null;

  return (
    <div className="youtube-marquee" aria-label="AR Group YouTube videos carousel">
      <div
        className="youtube-marquee__viewport"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
        onTouchCancel={resume}
      >
        <div
          className={`youtube-marquee__track ${paused ? 'youtube-marquee__track--paused' : ''} ${
            loading ? 'opacity-70' : ''
          }`}
          style={{ animationDuration: `${durationSec}s` }}
        >
          {loopItems.map((video, index) => (
            <div
              key={`${video.id}-${index}`}
              className={CARD_CLASS}
              aria-hidden={index >= videos.length ? true : undefined}
            >
              <YoutubeVideoCard
                video={video}
                variant="marquee"
                isLatest={index % videos.length === 0}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
