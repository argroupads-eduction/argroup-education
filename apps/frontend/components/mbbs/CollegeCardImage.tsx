'use client';

import { useEffect, useRef, useState } from 'react';
import { GraduationCap } from 'lucide-react';

type CollegeCardImageProps = {
  src: string | null;
  alt: string;
  variant?: 'default' | 'compact';
  /** Only the first visible card should eager-load (homepage LCP must stay on the hero). */
  priority?: boolean;
};

function collegeCardWebp(src: string): string | null {
  const path = src.split('?')[0] ?? src;
  const match = path.match(/\/wp-content\/uploads\/colleges\/([^/]+)\.(?:png|jpe?g)$/i);
  if (!match?.[1]) return null;
  return `/images/college-cards/${match[1]}.webp`;
}

export function CollegeCardImage({
  src,
  alt,
  variant = 'default',
  priority = false,
}: CollegeCardImageProps) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const [failed, setFailed] = useState(false);
  const [inView, setInView] = useState(priority);
  const [preferWebp, setPreferWebp] = useState(true);

  useEffect(() => {
    if (priority || inView) return;
    const el = hostRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '80px 0px', threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, inView]);

  if (!src || failed) {
    if (variant === 'compact') return null;
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
        <GraduationCap className="h-10 w-10" aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Medical college</span>
      </div>
    );
  }

  const webp = preferWebp ? collegeCardWebp(src) : null;
  const imgSrc = inView ? webp || src : undefined;
  const onImgError = () => {
    if (webp && preferWebp) {
      setPreferWebp(false);
      return;
    }
    setFailed(true);
  };

  if (variant === 'compact') {
    return (
      <span
        ref={hostRef}
        className="relative mr-1 h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100"
      >
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={alt || 'College campus'}
            className="h-full w-full object-contain object-center"
            width={40}
            height={40}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onError={onImgError}
          />
        ) : null}
      </span>
    );
  }

  return (
    <span ref={hostRef} className="absolute inset-0 block">
      {imgSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc}
          alt={alt}
          width={640}
          height={400}
          sizes="(max-width: 640px) 280px, 304px"
          className="absolute inset-0 h-full w-full object-contain object-center p-2 transition duration-300 group-hover:scale-[1.02]"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'low' : undefined}
          onError={onImgError}
        />
      ) : null}
    </span>
  );
}
