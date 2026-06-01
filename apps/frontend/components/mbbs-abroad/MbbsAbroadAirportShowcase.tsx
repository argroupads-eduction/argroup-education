'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Plane } from 'lucide-react';
import { AIRPORT_DIARIES } from '@/lib/airportDiaries';
import '@/styles/mbbs-abroad-airport.css';

/** Skip duplicate WP carousel frames at the start of the export. */
const GALLERY_IMAGES = AIRPORT_DIARIES.images.slice(2);

export function MbbsAbroadAirportShowcase() {
  const images = GALLERY_IMAGES;
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (delta: number) => {
      setActiveIndex((i) => (i + delta + images.length) % images.length);
    },
    [images.length]
  );

  useEffect(() => {
    if (paused || images.length < 2) return;
    const id = window.setInterval(() => go(1), 4500);
    return () => window.clearInterval(id);
  }, [go, paused, images.length]);

  if (!images.length) return null;

  const active = images[activeIndex] ?? images[0];

  return (
    <section className="abroad-airport" aria-labelledby="abroad-airport-title">
      <div className="abroad-airport__runway" aria-hidden />
      <div className="mx-auto max-w-7xl px-4">
        <div className="abroad-airport__head">
          <p className="abroad-airport__kicker">
            <Plane className="h-4 w-4" aria-hidden />
            Student departures
          </p>
          <h2 id="abroad-airport-title" className="abroad-airport__title">
            {AIRPORT_DIARIES.title}
          </h2>
          <p className="abroad-airport__lead">{AIRPORT_DIARIES.subtitle}</p>
        </div>

        <div
          className="abroad-airport__stage"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="abroad-airport__hero">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                className="abroad-airport__hero-frame"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.45 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={active.src} alt={active.alt} loading="lazy" decoding="async" />
                <span className="abroad-airport__stamp">Boarding pass</span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="abroad-airport__mosaic" role="list">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                role="listitem"
                className={[
                  'abroad-airport__tile',
                  i === activeIndex ? 'abroad-airport__tile--active' : '',
                  i % 5 === 0 ? 'abroad-airport__tile--wide' : '',
                  i % 7 === 3 ? 'abroad-airport__tile--tall' : '',
                ].join(' ')}
                onClick={() => setActiveIndex(i)}
                aria-label={img.alt}
                aria-current={i === activeIndex ? 'true' : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        </div>

        <div className="abroad-airport__footer">
          <p>Real moments from AR Group counselling batches — visa stamped, bags packed.</p>
          <Link href={AIRPORT_DIARIES.hubHref} className="abroad-airport__link">
            Explore MBBS abroad
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
