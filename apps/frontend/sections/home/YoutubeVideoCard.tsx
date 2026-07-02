import Link from 'next/link';
import { Play } from 'lucide-react';
import type { YoutubeVideo } from '@/lib/youtube/types';

function formatPublishedLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

type YoutubeVideoCardProps = {
  video: YoutubeVideo;
  variant?: 'marquee' | 'featured';
  isLatest?: boolean;
};

export function YoutubeVideoCard({ video, variant = 'marquee', isLatest = false }: YoutubeVideoCardProps) {
  const publishedLabel = formatPublishedLabel(video.publishedAt);

  return (
    <Link
      href={video.watchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`youtube-video-card youtube-video-card--${variant} group block shrink-0`}
      aria-label={`Watch on YouTube: ${video.title}`}
    >
      <div className="youtube-video-card__media">
        <img
          src={video.thumbnailUrl}
          alt=""
          className="youtube-video-card__thumb"
          loading="lazy"
          decoding="async"
        />
        <div className="youtube-video-card__scanlines" aria-hidden />
        <div className="youtube-video-card__overlay" aria-hidden />
        <div className="youtube-video-card__play" aria-hidden>
          <Play className="h-5 w-5 fill-current" />
        </div>
        {isLatest ? (
          <span className="youtube-video-card__badge youtube-video-card__badge--latest">Latest upload</span>
        ) : null}
        <span className="youtube-video-card__brand" aria-hidden>
          AR TV
        </span>
      </div>
      <div className="youtube-video-card__body">
        <h3 className="youtube-video-card__title">{video.title}</h3>
        {publishedLabel ? <p className="youtube-video-card__date">{publishedLabel}</p> : null}
      </div>
    </Link>
  );
}
