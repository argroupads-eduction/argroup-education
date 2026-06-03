'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GoogleReviewsPayload } from '@/lib/googleReviews/types';
import { fallbackTestimonials, type Testimonial } from './testimonialsData';
import { TestimonialCard } from './TestimonialCard';

const CARD_WRAPPER_CLASS =
  'group relative shrink-0 w-[min(85vw,18rem)] sm:w-72 md:w-80 z-0 hover:z-10';

export function TestimonialMarquee() {
  const [paused, setPaused] = useState(false);
  const [payload, setPayload] = useState<GoogleReviewsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/google-reviews');
        if (res.ok) {
          const data = (await res.json()) as GoogleReviewsPayload;
          if (!cancelled && data.reviews?.length) {
            setPayload(data);
          }
        }
      } catch {
        /* use fallback */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const reviews: Testimonial[] = useMemo(() => {
    if (payload?.reviews.length) {
      return payload.reviews.map((r) => ({ ...r, source: 'google' as const }));
    }
    return fallbackTestimonials;
  }, [payload]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  const loopItems = useMemo(() => [...reviews, ...reviews], [reviews]);

  const durationSec = Math.max(60, Math.min(240, reviews.length * 2.2));

  return (
    <div
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-x-hidden"
      aria-label="Google reviews carousel"
    >
      <div
        className="overflow-hidden px-4 sm:px-6 touch-pan-y"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
        onTouchCancel={resume}
      >
        <div
          className={`testimonial-marquee-track flex w-max gap-4 sm:gap-6 ${
            paused ? 'marquee-paused' : ''
          } ${loading ? 'opacity-70' : ''}`}
          style={{ animationDuration: `${durationSec}s` }}
        >
          {loopItems.map((testimonial, index) => (
            <div
              key={`${testimonial.id}-${index}`}
              className={CARD_WRAPPER_CLASS}
              aria-hidden={index >= reviews.length ? true : undefined}
            >
              <TestimonialCard testimonial={testimonial} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
