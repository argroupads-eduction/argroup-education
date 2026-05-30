'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type UIEvent,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type HorizontalScrollRowProps = {
  children: ReactNode;
  /** Gap between items — tailwind class on inner flex */
  gapClassName?: string;
  /** Enable auto-scroll on touch devices / narrow screens */
  autoScrollMobile?: boolean;
  autoScrollIntervalMs?: number;
  className?: string;
  ariaLabel?: string;
};

export function HorizontalScrollRow({
  children,
  gapClassName = 'gap-4',
  autoScrollMobile = true,
  autoScrollIntervalMs = 3500,
  className = '',
  ariaLabel = 'Scrollable row',
}: HorizontalScrollRowProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanPrev(scrollLeft > 4);
    setCanNext(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  const scrollByPage = useCallback((direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.max(240, Math.floor(el.clientWidth * 0.82));
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  }, []);

  const pauseAuto = useCallback(() => {
    pausedRef.current = true;
  }, []);

  const resumeAuto = useCallback(() => {
    window.setTimeout(() => {
      pausedRef.current = false;
    }, 4000);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateArrows, children]);

  useEffect(() => {
    if (!autoScrollMobile || !isMobile) return;
    const el = trackRef.current;
    if (!el) return;

    const tick = () => {
      if (pausedRef.current) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        const card = el.querySelector<HTMLElement>('[data-scroll-item]');
        const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.85;
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
      updateArrows();
    };

    const id = window.setInterval(tick, autoScrollIntervalMs);
    return () => window.clearInterval(id);
  }, [autoScrollMobile, autoScrollIntervalMs, isMobile, updateArrows, children]);

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    updateArrows();
    if (isMobile) {
      pauseAuto();
      resumeAuto();
    }
    e.stopPropagation();
  };

  return (
    <div className={`relative ${canPrev || canNext ? 'px-9 md:px-11' : ''} ${className}`.trim()}>
      {canPrev ? (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollByPage(-1)}
          className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-slate-200/90 bg-white/95 p-2 text-navy-900 shadow-lg backdrop-blur-sm transition hover:border-gold-300 hover:text-gold-700 md:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      ) : null}

      {canNext ? (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollByPage(1)}
          className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-slate-200/90 bg-white/95 p-2 text-navy-900 shadow-lg backdrop-blur-sm transition hover:border-gold-300 hover:text-gold-700 md:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      ) : null}

      {/* Mobile edge arrows — always visible when scrollable */}
      {canPrev ? (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollByPage(-1)}
          className="absolute left-1 top-1/2 z-10 flex -translate-y-1/2 rounded-full border border-slate-200/90 bg-white/95 p-1.5 text-navy-900 shadow-md md:hidden"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      ) : null}
      {canNext ? (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollByPage(1)}
          className="absolute right-1 top-1/2 z-10 flex -translate-y-1/2 rounded-full border border-slate-200/90 bg-white/95 p-1.5 text-navy-900 shadow-md md:hidden"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : null}

      <div
        ref={trackRef}
        role="region"
        aria-label={ariaLabel}
        className="horizontal-scroll-row -mx-1 overflow-x-auto px-1 pb-2 scroll-smooth"
        onScroll={onScroll}
        onMouseEnter={pauseAuto}
        onMouseLeave={resumeAuto}
        onTouchStart={pauseAuto}
        onTouchEnd={resumeAuto}
        onPointerDown={pauseAuto}
      >
        <div className={`flex w-max min-w-full ${gapClassName}`}>{children}</div>
      </div>
    </div>
  );
}

/** Wrapper for fixed-width carousel slides */
export function HorizontalScrollItem({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-scroll-item className={`shrink-0 snap-start ${className}`.trim()}>
      {children}
    </div>
  );
}
