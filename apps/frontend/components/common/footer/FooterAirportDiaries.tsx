'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
  AIRPORT_DIARIES,
  AIRPORT_DIARIES_DESTINATIONS,
  type AirportDiaryImage,
} from '@/lib/airportDiaries';
import '@/styles/airport-diaries-footer.css';

const AUTO_MS = 4200;

function OrbitRing({
  images,
  activeId,
  onSelect,
}: {
  images: AirportDiaryImage[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const count = images.length;
  const radius = 11.5;

  return (
    <div className="airport-diaries__orbit-scene" aria-hidden>
      <div className="airport-diaries__orbit-ring">
        {images.map((img, i) => {
          const angle = (360 / count) * i;
          return (
            <button
              key={img.id}
              type="button"
              tabIndex={-1}
              className={[
                'airport-diaries__orbit-card pointer-events-auto',
                activeId === img.id ? 'airport-diaries__orbit-card--active' : '',
              ].join(' ')}
              style={{
                transform: `rotateY(${angle}deg) translateZ(${radius}rem)`,
              }}
              onClick={() => onSelect(img.id)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="" loading="lazy" decoding="async" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilmMarquee({
  images,
  reverse,
  activeId,
  onSelect,
}: {
  images: AirportDiaryImage[];
  reverse?: boolean;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const loop = useMemo(() => [...images, ...images], [images]);

  return (
    <div className="airport-diaries__marquee">
      <div
        className={[
          'airport-diaries__marquee-track',
          reverse ? 'airport-diaries__marquee-track--reverse' : '',
        ].join(' ')}
      >
        {loop.map((img, i) => (
          <button
            key={`${img.id}-${i}`}
            type="button"
            className={[
              'airport-diaries__film-card',
              activeId === img.id ? 'airport-diaries__film-card--active' : '',
            ].join(' ')}
            onClick={() => onSelect(img.id)}
            aria-label={`View ${img.alt}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt={img.alt} loading="lazy" decoding="async" />
            <span className="airport-diaries__film-label">
              Gate {String((i % images.length) + 1).padStart(2, '0')}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function FooterAirportDiaries() {
  const { title, subtitle, hubHref, images } = AIRPORT_DIARIES;
  const [activeId, setActiveId] = useState(images[0]?.id ?? '');
  const [paused, setPaused] = useState(false);

  const activeIndex = images.findIndex((img) => img.id === activeId);
  const active = images[activeIndex >= 0 ? activeIndex : 0] ?? images[0];

  const selectById = useCallback((id: string) => {
    setActiveId(id);
    setPaused(true);
    window.setTimeout(() => setPaused(false), 8000);
  }, []);

  useEffect(() => {
    if (paused || images.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveId((current) => {
        const idx = images.findIndex((img) => img.id === current);
        const next = idx < 0 ? 0 : (idx + 1) % images.length;
        return images[next].id;
      });
    }, AUTO_MS);
    return () => window.clearInterval(timer);
  }, [images, paused]);

  const tickerItems = useMemo(
    () => [...AIRPORT_DIARIES_DESTINATIONS, ...AIRPORT_DIARIES_DESTINATIONS],
    []
  );

  const rowA = useMemo(() => images.filter((_, i) => i % 2 === 0), [images]);
  const rowB = useMemo(() => images.filter((_, i) => i % 2 === 1), [images]);

  if (!images.length) return null;

  return (
    <section className="airport-diaries" aria-labelledby="airport-diaries-heading">
      <div className="airport-diaries__runway" aria-hidden />
      <div className="airport-diaries__glow" aria-hidden />

      <div className="airport-diaries__inner">
        <div className="airport-diaries__ticker-wrap">
          <div className="airport-diaries__ticker">
            {tickerItems.map((route, i) => (
              <span key={`${route}-${i}`} className="airport-diaries__ticker-item">
                <span className="airport-diaries__ticker-dot" aria-hidden />
                {route}
                <span className="text-emerald-400/90"> · BOARDING</span>
              </span>
            ))}
          </div>
        </div>

        <div className="airport-diaries__grid">
          <div className="relative">
            <span className="airport-diaries__copy-kicker">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              MBBS Abroad · Live moments
            </span>
            <h2 id="airport-diaries-heading" className="airport-diaries__title">
              <span className="airport-diaries__title-accent">{title}</span>
            </h2>
            <p className="airport-diaries__lead">{subtitle}</p>

            <div className="airport-diaries__stats">
              <div className="airport-diaries__stat">
                <strong>{images.length}+</strong>
                Departures captured
              </div>
              <div className="airport-diaries__stat">
                <strong>24/7</strong>
                Airport support
              </div>
              <div className="airport-diaries__stat">
                <strong>4000+</strong>
                Students placed
              </div>
            </div>

            <Link href={hubHref} className="airport-diaries__cta group">
              Explore MBBS Abroad
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div
            className="airport-diaries__stage"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            <OrbitRing images={images} activeId={activeId} onSelect={selectById} />

            <div className="airport-diaries__spotlight">
              <div className="airport-diaries__spotlight-scan" aria-hidden />
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  className="airport-diaries__spotlight-img"
                  initial={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                  transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={active.src} alt={active.alt} loading="lazy" decoding="async" />
                </motion.div>
              </AnimatePresence>
              <div className="airport-diaries__boarding-pass">
                <span>AR GROUP</span>
                <span>
                  {String((activeIndex >= 0 ? activeIndex : 0) + 1).padStart(2, '0')} /{' '}
                  {String(images.length).padStart(2, '0')}
                </span>
                <span>DEPARTED ✈</span>
              </div>
            </div>
          </div>
        </div>

        <div className="airport-diaries__marquees">
          <FilmMarquee images={rowA.length ? rowA : images} activeId={activeId} onSelect={selectById} />
          <FilmMarquee
            images={rowB.length ? rowB : images}
            reverse
            activeId={activeId}
            onSelect={selectById}
          />
        </div>
      </div>
    </section>
  );
}
