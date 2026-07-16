'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CTA_GET_EXPERT_COUNSELLING } from '@/lib/brandCopy';
import { openLeadCapturePopup } from '@/lib/openLeadCapture';
import {
  prefetchMbbsHeroFormDefinitions,
  seedHeroMbbsFormDefinitions,
  type HeroMbbsFormDoc,
} from '@/lib/mbbsHeroFormDefinitionsCache';
import { MbbsIndiaHeroPayloadForm } from '@/sections/home/MbbsIndiaHeroPayloadForm';
import { HeroFormSkeleton } from '@/sections/home/HeroFormSkeleton';

const MbbsAbroadHeroPayloadForm = dynamic(
  () =>
    import('@/sections/home/MbbsAbroadHeroPayloadForm').then((m) => ({
      default: m.MbbsAbroadHeroPayloadForm,
    })),
  {
    loading: () => (
      <HeroFormSkeleton
        title="Quick enquiry (MBBS Abroad)"
        panelClass="w-full max-w-md rounded-2xl border border-white/25 bg-white/10 p-5 shadow-xl backdrop-blur-md lg:max-w-[20.5rem] xl:max-w-md"
      />
    ),
  }
);

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

/** MBBS India hero visible before switching to abroad. */
const INDIA_SHOW_MS = 15_000;
/** MBBS Abroad hero visible before switching back to India. */
const ABROAD_SHOW_MS = 15_000;

const BANNER_INDIA = '/india-homepage.webp';
const BANNER_ABROAD = '/abroad-homepage.webp';

export type HeroSectionProps = {
  initialForms?: {
    india?: HeroMbbsFormDoc | null;
    abroad?: HeroMbbsFormDoc | null;
  };
};

export const HeroSection = ({ initialForms }: HeroSectionProps) => {
  const seeded = useRef(false);
  if (initialForms && !seeded.current) {
    seedHeroMbbsFormDefinitions(initialForms);
    seeded.current = true;
  }

  const [variant, setVariant] = useState<HeroVariant>('india');
  const [heroFormActive, setHeroFormActive] = useState(false);
  const [heroFormSubmitted, setHeroFormSubmitted] = useState(false);
  const [text, setText] = useState('');
  const [collegeIndex, setCollegeIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const formZoneRef = useRef<HTMLDivElement>(null);

  const colleges = useMemo(
    () => (variant === 'india' ? COLLEGES_INDIA : COLLEGES_ABROAD),
    [variant]
  );

  const carouselPaused = heroFormActive && !heroFormSubmitted;
  // Warm both hero form definitions in parallel (no carousel delay).
  useEffect(() => {
    prefetchMbbsHeroFormDefinitions(['india', 'abroad']);
  }, []);

  // Pause auto-rotate while the hero enquiry form is in use until it is submitted.
  useEffect(() => {
    const zone = formZoneRef.current;
    if (!zone) return;

    const lockCarousel = () => setHeroFormActive(true);

    zone.addEventListener('pointerdown', lockCarousel);
    zone.addEventListener('focusin', lockCarousel);

    return () => {
      zone.removeEventListener('pointerdown', lockCarousel);
      zone.removeEventListener('focusin', lockCarousel);
    };
  }, [variant]);

  const handleHeroFormSubmitted = () => {
    setHeroFormSubmitted(true);
  };
  // Auto-rotate India -> Abroad -> India (skipped while form is in use).
  useEffect(() => {
    if (carouselPaused) return;

    const ms = variant === 'india' ? INDIA_SHOW_MS : ABROAD_SHOW_MS;
    const id = window.setTimeout(() => {
      setVariant((v) => (v === 'india' ? 'abroad' : 'india'));
    }, ms);
    return () => window.clearTimeout(id);
  }, [variant, carouselPaused]);

  // Reset typewriter and carousel lock when banner mode switches
  useEffect(() => {
    setText('');
    setCollegeIndex(0);
    setIsDeleting(false);
    setHeroFormActive(false);
    setHeroFormSubmitted(false);  }, [variant]);

  useEffect(() => {
    const currentCollege = colleges[collegeIndex];
    if (!currentCollege) return;

    const typingSpeed = isDeleting ? 42 : 72;
    const pauseAtEnd = 1100;

    const timer = window.setTimeout(() => {
      if (!isDeleting) {
        const next = currentCollege.slice(0, text.length + 1);
        setText(next);
        if (next === currentCollege) {
          window.setTimeout(() => setIsDeleting(true), pauseAtEnd);
        }
      } else {
        const next = currentCollege.slice(0, Math.max(0, text.length - 1));
        setText(next);
        if (next.length === 0) {
          setIsDeleting(false);
          setCollegeIndex((prev) => (prev + 1) % colleges.length);
        }
      }
    }, typingSpeed);

    return () => window.clearTimeout(timer);
  }, [text, isDeleting, collegeIndex, colleges]);

  const overlayIndia =
    'linear-gradient(90deg, rgba(6, 33, 63, 0.78) 0%, rgba(8, 58, 100, 0.55) 45%, rgba(14, 120, 180, 0.35) 100%)';
  const overlayAbroad =
    'linear-gradient(90deg, rgba(6, 33, 63, 0.82) 0%, rgba(8, 52, 90, 0.68) 35%, rgba(12, 97, 161, 0.42) 100%)';

  return (
    <section className="relative min-h-[28rem] overflow-hidden pt-16 md:min-h-[32rem] md:pt-20 lg:min-h-[36rem]">
      {/* Cross-fading backgrounds, Next/Image + CSS (lighter than framer-motion) */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            variant === 'india' ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden
        >
          <Image
            src={BANNER_INDIA}
            alt=""
            fill
            priority
            quality={82}
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0" style={{ background: overlayIndia }} />
        </div>
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            variant === 'abroad' ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden
        >
          <Image
            src={BANNER_ABROAD}
            alt=""
            fill
            loading="lazy"
            quality={82}
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0" style={{ background: overlayAbroad }} />
        </div>
      </div>

      {variant === 'india' && (
        <button
          type="button"
          aria-label="Next: MBBS Abroad banner"
          title="MBBS Abroad"
          disabled={carouselPaused}
          onClick={() => setVariant('abroad')}
          className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:border-gold-400/60 hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 disabled:pointer-events-none disabled:opacity-40 sm:right-5 md:h-12 md:w-12 lg:right-8"
        >
          <ChevronRight className="h-6 w-6 md:h-7 md:w-7" aria-hidden strokeWidth={2.5} />
        </button>
      )}

      {variant === 'abroad' && (
        <button
          type="button"
          aria-label="Back: MBBS India banner"
          title="MBBS India"
          disabled={carouselPaused}
          onClick={() => setVariant('india')}
          className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:border-gold-400/60 hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 disabled:pointer-events-none disabled:opacity-40 sm:left-5 md:h-12 md:w-12 lg:left-8"
        >
          <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" aria-hidden strokeWidth={2.5} />
        </button>
      )}

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 md:py-24 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-12">
          {/* India: copy left, enquiry form right (vertically centred in column) */}
          {variant === 'india' && (
            <>
              <div className="max-w-3xl lg:pr-4 lg:text-left">
                <span className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm md:text-sm">
                  <Sparkles className="h-4 w-4 text-gold-400" />
                  MBBS in India - Leading Colleges
                </span>

                <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl lg:text-6xl">
                  Study MBBS in
                  <span className="mt-2 block text-gold-400">India&apos;s Top Colleges</span>
                </h1>

                <div className="mt-6 rounded-xl border border-white/30 bg-white/10 px-4 py-4 backdrop-blur-sm md:px-5 lg:max-w-md">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                    Featured college (India)
                  </p>
                  <p className="mt-2 min-h-[2.75rem] text-lg font-semibold text-white md:min-h-[3.25rem] md:text-2xl">
                    {text}
                    <span className="ml-1 inline-block h-6 w-[2px] animate-pulse bg-gold-400 align-middle" />
                  </p>
                </div>

                <p className="mt-5 max-w-2xl text-base text-blue-50/95 md:text-lg">
                  Admission guidance for MBBS across India - counseling, college shortlisting, and documentation support.
                </p>

                <div className="hero-cta-row mt-7 flex w-full max-w-xl flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className="group w-full sm:min-w-[12.5rem] sm:flex-1"
                    onClick={() => openLeadCapturePopup()}
                  >
                    {CTA_GET_EXPERT_COUNSELLING}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Link
                    href="/#mbbs-india-colleges"
                    className="ui-btn ui-btn--secondary ui-btn--lg w-full border-white/60 bg-white/15 text-white hover:bg-white/25 sm:min-w-0 sm:flex-1"
                  >
                    Explore States
                  </Link>
                </div>
              </div>

              <div
                ref={formZoneRef}
                className="flex min-h-0 w-full flex-col items-center justify-center pt-10 lg:min-h-full lg:pt-0"
              >
                <MbbsIndiaHeroPayloadForm
                  layout="heroSide"
                  className="w-full max-w-md lg:max-w-[20.5rem] xl:max-w-md"
                  onCarouselFormSubmitted={handleHeroFormSubmitted}
                />
              </div>
            </>
          )}

          {/* Abroad: enquiry form left (desktop), copy right; mobile keeps copy first */}
          {variant === 'abroad' && (
            <>
              <div
                ref={formZoneRef}
                className="order-2 flex min-h-0 w-full flex-col items-center justify-center pt-10 lg:order-1 lg:min-h-full lg:items-start lg:pt-0"
              >
                <MbbsAbroadHeroPayloadForm
                  layout="heroSide"
                  className="w-full max-w-md lg:max-w-[20.5rem] xl:max-w-md"
                  onCarouselFormSubmitted={handleHeroFormSubmitted}
                />
              </div>

              <div className="order-1 max-w-3xl lg:order-2 lg:pr-4 lg:text-left">
                <span className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm md:text-sm">
                  <Sparkles className="h-4 w-4 text-gold-400" />
                  MBBS Abroad - Global Pathways
                </span>

                <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl lg:text-6xl">
                  Studying MBBS at
                  <span className="mt-2 block text-gold-400">Top Universities Abroad</span>
                </h1>

                <div className="mt-6 rounded-xl border border-white/30 bg-white/10 px-4 py-4 backdrop-blur-sm md:px-5 lg:max-w-md">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                    Featured college (Abroad)
                  </p>
                  <p className="mt-2 min-h-[2.75rem] text-lg font-semibold text-white md:min-h-[3.25rem] md:text-2xl">
                    {text}
                    <span className="ml-1 inline-block h-6 w-[2px] animate-pulse bg-gold-400 align-middle" />
                  </p>
                </div>

                <p className="mt-5 max-w-2xl text-base text-blue-50/95 md:text-lg">
                  Trusted support for MBBS abroad - university selection, applications, and visa assistance end to end.
                </p>

                <div className="hero-cta-row mt-7 flex w-full max-w-xl flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className="group w-full sm:min-w-0 sm:flex-1"
                    onClick={() => openLeadCapturePopup()}
                  >
                    {CTA_GET_EXPERT_COUNSELLING}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Link
                    href="/mbbs-abroad#mbbs-abroad-colleges"
                    className="ui-btn ui-btn--secondary ui-btn--lg w-full border-white/60 bg-white/15 text-white hover:bg-white/25 sm:min-w-0 sm:flex-1"
                  >
                    Explore Countries
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
