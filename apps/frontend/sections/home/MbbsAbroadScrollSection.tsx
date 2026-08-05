'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent, type TouchEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Globe2 } from 'lucide-react';
import {
  MBBS_ABROAD_SCROLL_COUNTRIES,
  resolveMbbsAbroadScrollImage,
} from '@/lib/mbbsAbroadScrollCountries';

const AUTOPLAY_MS = 4800;
const SLIDE_MS = 900;
const TOUCH_RESUME_MS = 6000;
const SWIPE_PX = 48;
const EYEBROW = 'DESTINATION ATLAS';

/**
 * Destination Atlas — autoplay loop with desktop hover-pause and
 * mobile/tablet touch-pause (resumes after idle). Swipe left/right to change.
 */
export function MbbsAbroadScrollSection() {
  const countries = MBBS_ABROAD_SCROLL_COUNTRIES;
  const count = countries.length;
  const sectionRef = useRef<HTMLElement | null>(null);
  const resumeTimerRef = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [leavingIndex, setLeavingIndex] = useState<number | null>(null);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [touchPaused, setTouchPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  const paused = hoverPaused || touchPaused || !inView;

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current != null) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  /** Touch/pen: pause now, auto-resume after idle so loop keeps going. */
  const pauseForTouch = useCallback(() => {
    clearResumeTimer();
    setTouchPaused(true);
    resumeTimerRef.current = window.setTimeout(() => {
      setTouchPaused(false);
      resumeTimerRef.current = null;
    }, TOUCH_RESUME_MS);
  }, [clearResumeTimer]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.35)),
      { threshold: [0, 0.35, 0.6] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => () => clearResumeTimer(), [clearResumeTimer]);

  const goTo = useCallback(
    (next: number) => {
      const idx = ((next % count) + count) % count;
      setActiveIndex((prev) => {
        if (prev === idx) return prev;
        setLeavingIndex(prev);
        return idx;
      });
    },
    [count]
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    if (reduceMotion || paused || count <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => {
        setLeavingIndex(prev);
        return (prev + 1) % count;
      });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, count, reduceMotion, activeIndex]);

  useEffect(() => {
    if (leavingIndex === null) return;
    const t = window.setTimeout(() => setLeavingIndex(null), SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [leavingIndex]);

  const onPointerEnter = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse') setHoverPaused(true);
  };

  const onPointerLeave = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse') setHoverPaused(false);
  };

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      pauseForTouch();
    }
  };

  const onTouchStart = (e: TouchEvent<HTMLElement>) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
    pauseForTouch();
  };

  const onTouchEnd = (e: TouchEvent<HTMLElement>) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const end = e.changedTouches[0]?.clientX;
    if (end == null) return;
    const delta = end - start;
    if (Math.abs(delta) < SWIPE_PX) return;
    pauseForTouch();
    if (delta < 0) goNext();
    else goPrev();
  };

  const country = countries[activeIndex]!;
  const prevName = countries[(activeIndex - 1 + count) % count]!.name;
  const nextName = countries[(activeIndex + 1) % count]!.name;

  return (
    <section
      ref={sectionRef}
      id="mbbs-abroad"
      className="abroad-atlas"
      aria-label="MBBS Abroad destinations"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onFocusCapture={() => setHoverPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setHoverPaused(false);
        }
      }}
    >
      <div className="abroad-atlas__grid" aria-hidden />
      <div className="abroad-atlas__glow" aria-hidden />

      <div className="abroad-atlas__inner">
        <p className="abroad-atlas__eyebrow">{EYEBROW}</p>
        <p className="abroad-atlas__lede">
          <strong>AR Group of Education</strong> helps Indian students secure MBBS seats at WHO-listed
          universities in <span className="abroad-atlas__lede-accent">{count}+ countries</span>, with
          end-to-end support for counselling, admissions, scholarships, documentation, and visa.
        </p>

        <nav className="abroad-atlas__seo-links" aria-label="MBBS abroad country pages">
          <ul>
            {countries.map((c) => (
              <li key={`seo-${c.slug}`}>
                <Link href={`/mbbs-abroad/${c.slug}`}>Study MBBS in {c.name}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="abroad-atlas__stage">
          <div className="abroad-atlas__copy" aria-live="polite">
            <div key={country.slug} className="abroad-atlas__slide">
              <span className="abroad-atlas__badge">
                <Globe2 className="h-3.5 w-3.5" aria-hidden />
                {country.name}
              </span>

              <h2 className="abroad-atlas__title">
                Study MBBS in{' '}
                <span className="abroad-atlas__title-accent">{country.name}</span>
              </h2>

              <p className="abroad-atlas__tagline">{country.tagline}</p>
              <p className="abroad-atlas__desc">{country.description}</p>

              <Link href={`/mbbs-abroad/${country.slug}`} className="abroad-atlas__cta">
                Explore {country.name}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="abroad-atlas__media">
            <button
              type="button"
              className="abroad-atlas__nav abroad-atlas__nav--prev"
              onClick={() => {
                pauseForTouch();
                goPrev();
              }}
              aria-label={`Previous destination: ${prevName}`}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </button>

            <div className="abroad-atlas__visual">
              {countries.map((c, i) => {
                const src = resolveMbbsAbroadScrollImage(c);
                const active = i === activeIndex;
                const leaving = i === leavingIndex;
                const layerClass = [
                  'abroad-atlas__visual-layer',
                  active ? 'is-active' : '',
                  leaving ? 'is-leaving' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <div key={c.slug} className={layerClass} aria-hidden={!active}>
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element -- atlas carousel heroes
                      <img
                        src={src}
                        alt={active ? `MBBS in ${c.name}` : ''}
                        className="abroad-atlas__visual-img"
                        decoding="async"
                        draggable={false}
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{
                          background: `linear-gradient(145deg, ${c.accent}55, #041018)`,
                        }}
                      />
                    )}
                  </div>
                );
              })}
              <span className="abroad-atlas__visual-veil" aria-hidden />

              <span className="abroad-atlas__step-mark" aria-hidden>
                {String(activeIndex + 1).padStart(2, '0')}
              </span>

              <div
                className={`abroad-atlas__progress${paused || reduceMotion ? ' is-paused' : ''}`}
                aria-hidden
              >
                <span
                  key={`prog-${activeIndex}-${paused ? 'p' : 'r'}`}
                  style={{ animationDuration: `${AUTOPLAY_MS}ms` }}
                />
              </div>
            </div>

            <button
              type="button"
              className="abroad-atlas__nav abroad-atlas__nav--next"
              onClick={() => {
                pauseForTouch();
                goNext();
              }}
              aria-label={`Next destination: ${nextName}`}
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
