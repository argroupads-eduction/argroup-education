'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
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
}: HeroCopyProps) {
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

      <h1
        className={`mt-3 text-[clamp(1.4rem,5.8vw,1.85rem)] font-black leading-[1.15] text-white sm:mt-4 sm:text-4xl md:text-5xl md:[text-shadow:none] lg:text-[3.25rem] xl:text-6xl ${readable}`}
      >
        {titleLine}
        <span className="mt-1 block text-gold-400 sm:mt-2">{titleAccent}</span>
      </h1>

      {/* Mobile: plain copy (no glass). md+: light glass card */}
      <div className="mt-3 sm:mt-4 md:mt-6 md:rounded-xl md:border md:border-white/25 md:bg-white/10 md:px-5 md:py-4 md:backdrop-blur-sm">
        <p
          className={`text-[10px] font-semibold uppercase tracking-wider text-white sm:text-xs md:text-blue-100 md:[text-shadow:none] ${readable}`}
        >
          {featuredLabel}
        </p>
        <p
          className={`mt-1 min-h-[2.1rem] break-words text-[clamp(1rem,4.4vw,1.2rem)] font-semibold text-white sm:mt-1.5 sm:min-h-[2.5rem] sm:text-lg md:min-h-[3.25rem] md:text-xl md:[text-shadow:none] lg:text-2xl ${readable}`}
        >
          {typedText}
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
          className="ui-btn ui-btn--secondary ui-btn--lg !w-full !justify-center !border-white/80 !bg-black/25 !text-center !text-white shadow-md hover:!bg-black/35 hover:!text-white sm:!min-w-0 sm:!flex-1 md:!bg-white/15"
        >
          {secondaryLabel}
        </Link>
      </div>
    </>
  );
}

export const HeroSection = () => {
  const [mounted, setMounted] = useState(false);
  const [variant, setVariant] = useState<HeroVariant>('india');
  // Seed first college so SSR + first paint reserve stable copy height (no blank→type jump).
  const [text, setText] = useState(COLLEGES_INDIA[0]);
  const [collegeIndex, setCollegeIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const skipVariantReset = useRef(true);

  const colleges = useMemo(
    () => (variant === 'india' ? COLLEGES_INDIA : COLLEGES_ABROAD),
    [variant]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const ms = variant === 'india' ? INDIA_SHOW_MS : ABROAD_SHOW_MS;
    const id = window.setTimeout(() => {
      setVariant((v) => (v === 'india' ? 'abroad' : 'india'));
    }, ms);
    return () => window.clearTimeout(id);
  }, [variant, mounted]);

  useEffect(() => {
    if (!mounted) return;
    // Do not wipe the seeded first college on hydrate — only when India ↔ Abroad flips.
    if (skipVariantReset.current) {
      skipVariantReset.current = false;
      return;
    }
    setText('');
    setCollegeIndex(0);
    setIsDeleting(false);
  }, [variant, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const current = colleges[collegeIndex] ?? '';
    let timeout: number;

    if (!isDeleting && text === current) {
      timeout = window.setTimeout(() => setIsDeleting(true), 1800);
    } else if (isDeleting && text === '') {
      setIsDeleting(false);
      setCollegeIndex((i) => (i + 1) % colleges.length);
    } else {
      timeout = window.setTimeout(
        () => {
          setText((prev) =>
            isDeleting ? prev.slice(0, -1) : current.slice(0, prev.length + 1)
          );
        },
        isDeleting ? 38 : 70
      );
    }

    return () => window.clearTimeout(timeout);
  }, [text, isDeleting, collegeIndex, colleges, mounted]);

  const navBtnClass =
    'absolute z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-navy-950/55 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:border-gold-400/60 hover:bg-navy-900/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 sm:h-11 sm:w-11 md:h-12 md:w-12';

  const bannerAlt =
    variant === 'india'
      ? 'AR Group of Education - Study MBBS in India top medical colleges counselling'
      : 'AR Group of Education - Studying MBBS at top universities abroad counselling';

  return (
    <section className="relative flex min-h-[32rem] items-start overflow-hidden bg-navy-900 sm:min-h-[36rem] sm:items-center md:min-h-[42rem] lg:min-h-[48rem] xl:min-h-[52rem]">
      {/* Native img avoids next/image SSR vs client attr mismatches that trigger hydration errors. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BANNER}
        alt={bannerAlt}
        width={1920}
        height={1080}
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover max-md:object-[62%_center] md:object-[28%_center] lg:object-left"
      />

      {/* Soft wash — keep banner blue readable under copy (avoid crushing the right studio side) */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/25 to-transparent sm:via-navy-950/20 md:bg-gradient-to-l md:from-navy-950/72 md:via-[#0b3a7a]/35 md:to-transparent"
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
        <div className="w-full max-w-xl md:max-w-md md:pl-6 lg:max-w-lg lg:pl-10 xl:max-w-xl xl:pl-16">
          {variant === 'india' ? (
            <HeroCopy
              badge="MBBS in India - Leading Colleges"
              titleLine="Study MBBS in"
              titleAccent="India's Top Colleges"
              featuredLabel="Featured college (India)"
              typedText={text}
              description="Admission guidance for MBBS across India - counseling, college shortlisting, and documentation support."
              secondaryHref="/#mbbs-india-colleges"
              secondaryLabel="Explore States"
            />
          ) : (
            <HeroCopy
              badge="MBBS Abroad - Global Pathways"
              titleLine="Studying MBBS at"
              titleAccent="Top Universities Abroad"
              featuredLabel="Featured college (Abroad)"
              typedText={text}
              description="Trusted support for MBBS abroad - university selection, applications, and visa assistance end to end."
              secondaryHref="/mbbs-abroad#mbbs-abroad-colleges"
              secondaryLabel="Explore Countries"
            />
          )}
        </div>
      </div>
    </section>
  );
};
