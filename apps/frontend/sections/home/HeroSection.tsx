'use client';

import Link from 'next/link';
import { startTransition, useEffect, useMemo, useRef, useState, type Ref } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CTA_GET_EXPERT_COUNSELLING } from '@/lib/brandCopy';
import { openLeadCapturePopup } from '@/lib/openLeadCapture';

type HeroVariant = 'india' | 'abroad';

const COLLEGES_INDIA = [
  'AIIMS New Delhi',
  'Maulana Azad Medical College, Delhi',
  'Seth GS Medical College, Mumbai',
  'KGMU, Lucknow',
  'Lady Hardinge Medical College, Delhi',
  'JIPMER Puducherry',
];

const COLLEGES_ABROAD = [
  'Tbilisi State Medical University',
  'Kazan Federal University',
  'Al-Farabi Kazakh National University',
  'Kyrgyz State Medical Academy',
  'Bashkir State Medical University',
  'Bukhara State Medical Institute',
];

const INDIA_SHOW_MS = 15_000;
const ABROAD_SHOW_MS = 15_000;
const BANNER = '/hero-banner-aug4.webp';
const BANNER_SRCSET =
  '/hero-banner-aug4-640.webp 640w, /hero-banner-aug4-1280.webp 1280w, /hero-banner-aug4.webp 1920w';
const BANNER_SIZES = '100vw';

type HeroCopyProps = {
  badge: string;
  titleLine: string;
  titleAccent: string;
  featuredLabel: string;
  typedText: string;
  description: string;
  secondaryHref: string;
  secondaryLabel: string;
};

function HeroCopy({
  badge,
  titleLine,
  titleAccent,
  featuredLabel,
  typedText,
  description,
  secondaryHref,
  secondaryLabel,
  collegeRef,
}: HeroCopyProps & { collegeRef?: Ref<HTMLSpanElement> }) {
  const readable =
    'max-md:[text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_2px_14px_rgba(0,0,0,0.55)]';

  return (
    <>
      <span
        className={`inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/45 bg-black/25 px-2.5 py-1 text-[11px] font-semibold leading-tight text-white sm:gap-2 sm:px-3 sm:text-xs md:border-white/30 md:bg-white/15 md:text-sm md:backdrop-blur-sm ${readable}`}
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-gold-400 sm:h-4 sm:w-4" aria-hidden />
        <span className="truncate">{badge}</span>
      </span>

      {/* Use div (not h1/h2): homepage H1 lives in SEO section; avoids stale-chunk h1↔h2 hydration fights. */}
      <div
        role="heading"
        aria-level={2}
        data-hero-title="v3"
        className={`mt-3 text-[clamp(1.4rem,5.8vw,1.85rem)] font-black leading-[1.15] text-white sm:mt-4 sm:text-4xl md:text-5xl md:[text-shadow:none] lg:text-[3.25rem] xl:text-6xl ${readable}`}
      >
        {titleLine}
        <span className="mt-1 block text-gold-400 sm:mt-2">{titleAccent}</span>
      </div>

      {/* Mobile: plain copy (no glass). md+: light glass card */}
      <div className="mt-3 sm:mt-4 md:mt-6 md:rounded-xl md:border md:border-white/25 md:bg-white/10 md:px-5 md:py-4 md:backdrop-blur-sm">
        <p
          className={`text-[10px] font-semibold uppercase tracking-wider text-white sm:text-xs md:text-blue-100 md:[text-shadow:none] ${readable}`}
        >
          {featuredLabel}
        </p>
        <p
          className={`mt-1 min-h-[3.25rem] break-words text-[clamp(1rem,4.4vw,1.2rem)] font-semibold leading-snug text-white sm:mt-1.5 sm:text-lg md:min-h-[3.5rem] md:text-xl md:[text-shadow:none] lg:text-2xl ${readable}`}
        >
          <span ref={collegeRef}>{typedText}</span>
          <span className="ml-1 inline-block h-5 w-[2px] animate-pulse bg-gold-400 align-middle sm:h-6" />
        </p>
      </div>

      <p
        className={`mt-3 text-[clamp(0.85rem,3.7vw,1rem)] leading-relaxed text-white sm:mt-4 sm:max-w-prose sm:text-base md:mt-5 md:text-lg md:text-blue-50/95 md:[text-shadow:none] ${readable}`}
      >
        {description}
      </p>

      <div className="hero-cta-row mt-4 flex w-full flex-col items-stretch gap-2.5 sm:mt-6 sm:flex-row sm:flex-wrap sm:gap-3 md:mt-7">
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="group w-full justify-center text-[clamp(0.85rem,3.5vw,1rem)] shadow-lg sm:min-w-[11rem] sm:flex-1 md:min-w-[12.5rem]"
          onClick={() => openLeadCapturePopup()}
        >
          {CTA_GET_EXPERT_COUNSELLING}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
        </Button>
        <Link
          href={secondaryHref}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-white bg-[#0c2340] px-4 text-center text-[clamp(0.85rem,3.5vw,1rem)] font-semibold text-white shadow-md hover:bg-[#08182e] sm:min-w-0 sm:flex-1"
        >
          {secondaryLabel}
        </Link>
      </div>
    </>
  );
}

export const HeroSection = () => {
  const [variant, setVariant] = useState<HeroVariant>('india');
  const collegeRef = useRef<HTMLSpanElement>(null);

  const colleges = useMemo(
    () => (variant === 'india' ? COLLEGES_INDIA : COLLEGES_ABROAD),
    [variant]
  );
  const text = colleges[0] ?? '';

  useEffect(() => {
    const ms = variant === 'india' ? INDIA_SHOW_MS : ABROAD_SHOW_MS;
    const id = window.setTimeout(() => {
      startTransition(() => {
        setVariant((v) => (v === 'india' ? 'abroad' : 'india'));
      });
    }, ms);
    return () => window.clearTimeout(id);
  }, [variant]);

  useEffect(() => {
    const node = collegeRef.current;
    if (!node) return;
    let index = 0;
    let paused = false;
    let timer = 0;
    const paint = (next: number) => {
      const el = collegeRef.current;
      if (!el) return;
      el.textContent = colleges[next] ?? '';
    };
    const schedule = () => {
      window.clearTimeout(timer);
      if (paused) return;
      timer = window.setTimeout(() => {
        index = (index + 1) % colleges.length;
        paint(index);
        schedule();
      }, 3200);
    };
    schedule();
    const pause = () => {
      paused = true;
      window.clearTimeout(timer);
    };
    const resume = () => {
      if (!paused) return;
      paused = false;
      schedule();
    };
    window.addEventListener('pointerdown', pause, { passive: true });
    window.addEventListener('pointerup', resume, { passive: true });
    window.addEventListener('pointercancel', resume, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', pause);
      window.removeEventListener('pointerup', resume);
      window.removeEventListener('pointercancel', resume);
    };
  }, [colleges]);

  const navBtnClass =
    'absolute z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-navy-950/55 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:border-gold-400/60 hover:bg-navy-900/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 sm:h-11 sm:w-11 md:h-12 md:w-12';

  const bannerAlt =
    'AR Group of Education - MBBS India and Abroad admission counselling';

  return (
    <section className="relative flex min-h-[32rem] items-start overflow-hidden bg-navy-900 sm:min-h-[36rem] sm:items-center md:min-h-[42rem] lg:min-h-[48rem] xl:min-h-[52rem]">
      {/* Single LCP image — no CSS background duplicate (was 2x network). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BANNER}
        srcSet={BANNER_SRCSET}
        sizes={BANNER_SIZES}
        alt={bannerAlt}
        width={1280}
        height={552}
        decoding="sync"
        fetchPriority="high"
        className="home-hero-photo absolute inset-0 z-0 h-full w-full object-cover object-[18%_center] md:object-[22%_center] lg:object-left"
        onError={(e) => {
          const img = e.currentTarget;
          if (img.dataset.retried === '1') return;
          img.dataset.retried = '1';
          img.removeAttribute('srcset');
          img.src = BANNER;
        }}
      />

      {/* Soft wash — keep banner blue readable under copy (avoid crushing the right studio side) */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950/55 via-navy-950/10 to-transparent md:bg-gradient-to-l md:from-navy-950/72 md:via-[#0b3a7a]/28 md:to-transparent"
        aria-hidden
      />

      {variant === 'india' ? (
        <button
          type="button"
          aria-label="Next: MBBS Abroad banner"
          title="MBBS Abroad"
          onClick={() => setVariant('abroad')}
          className={`${navBtnClass} right-3 top-3 sm:right-4 sm:top-1/2 sm:-translate-y-1/2 md:right-6 lg:right-8`}
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" aria-hidden strokeWidth={2.5} />
        </button>
      ) : (
        <button
          type="button"
          aria-label="Back: MBBS India banner"
          title="MBBS India"
          onClick={() => setVariant('india')}
          className={`${navBtnClass} left-3 top-3 sm:left-4 sm:top-1/2 sm:-translate-y-1/2 md:left-6 lg:left-8`}
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" aria-hidden strokeWidth={2.5} />
        </button>
      )}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-6 pt-5 sm:px-6 sm:pb-12 sm:pt-16 md:flex md:justify-end md:px-8 md:py-20 lg:px-12 lg:py-24">
        <div className="w-full max-w-xl rounded-2xl bg-[#0b2344]/55 px-4 py-4 shadow-xl backdrop-blur-[2px] md:max-w-md md:rounded-none md:bg-transparent md:px-0 md:py-0 md:pl-6 md:shadow-none md:backdrop-blur-none lg:max-w-lg lg:pl-10 xl:max-w-xl xl:pl-16">
          {variant === 'india' ? (
            <HeroCopy
              badge="MBBS in India - College Guidance"
              titleLine="Study MBBS in"
              titleAccent="India's Top Colleges"
              featuredLabel="College guide (India)"
              collegeRef={collegeRef}
              typedText={text}
              description="Admission guidance for MBBS across India: NEET counselling, college shortlisting and documentation support."
              secondaryHref="/#mbbs-india-colleges"
              secondaryLabel="Explore States"
            />
          ) : (
            <HeroCopy
              badge="MBBS Abroad - Global Pathways"
              titleLine="MBBS Abroad Guidance"
              titleAccent="for Indian Students"
              featuredLabel="University guide (Abroad)"
              collegeRef={collegeRef}
              typedText={text}
              description="Guidance for MBBS abroad: university selection, applications and visa support for Indian students."
              secondaryHref="/mbbs-abroad#mbbs-abroad-colleges"
              secondaryLabel="Explore Countries"
            />
          )}
        </div>
      </div>
    </section>
  );
};
