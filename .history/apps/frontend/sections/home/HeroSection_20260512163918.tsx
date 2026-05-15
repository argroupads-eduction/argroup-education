'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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

const INDIA_SHOW_MS = 12_000;
const ABROAD_SHOW_MS = 12_000;

const BANNER_INDIA = '/hero-mbbs-india-banner.png';
const BANNER_ABROAD = '/hero-mbbs-abroad-banner.png';

export const HeroSection = () => {
  const [variant, setVariant] = useState<HeroVariant>('india');
  const [text, setText] = useState('');
  const [collegeIndex, setCollegeIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const colleges = useMemo(
    () => (variant === 'india' ? COLLEGES_INDIA : COLLEGES_ABROAD),
    [variant]
  );

  // Auto-rotate India → Abroad → India …
  useEffect(() => {
    const ms = variant === 'india' ? INDIA_SHOW_MS : ABROAD_SHOW_MS;
    const id = window.setTimeout(() => {
      setVariant((v) => (v === 'india' ? 'abroad' : 'india'));
    }, ms);
    return () => window.clearTimeout(id);
  }, [variant]);

  // Reset typewriter when banner mode switches
  useEffect(() => {
    setText('');
    setCollegeIndex(0);
    setIsDeleting(false);
  }, [variant]);

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
      {/* Cross-fading full-bleed backgrounds */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `${overlayIndia}, url(${BANNER_INDIA})`,
          }}
          initial={false}
          animate={{ opacity: variant === 'india' ? 1 : 0 }}
          transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
          aria-hidden
        />
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `${overlayAbroad}, url(${BANNER_ABROAD})`,
          }}
          initial={false}
          animate={{ opacity: variant === 'abroad' ? 1 : 0 }}
          transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 md:py-24 lg:py-28">
        <motion.div
          key={variant}
          initial={{ opacity: 0, rotateY: -18, x: 40, scale: 0.96 }}
          animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          className="grid gap-8 lg:grid-cols-2 lg:items-center"
        >
          <div className="hidden lg:block" />

          <div className="max-w-3xl lg:ml-auto lg:text-right">
            <span className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm md:text-sm">
              <Sparkles className="h-4 w-4 text-gold-400" />
              {variant === 'india' ? 'MBBS in India — Leading Colleges' : 'MBBS Abroad — Global Pathways'}
            </span>

            <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl lg:text-6xl">
              {variant === 'india' ? (
                <>
                  Study MBBS in
                  <span className="mt-2 block text-gold-400">India’s Top Colleges</span>
                </>
              ) : (
                <>
                  Study MBBS
                  <span className="mt-2 block text-gold-400">Abroad — World-Class Universities</span>
              </>
              )}
            </h1>

            <div className="mt-6 rounded-xl border border-white/30 bg-white/10 px-4 py-4 backdrop-blur-sm md:px-5 lg:mx-auto lg:max-w-md">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                {variant === 'india' ? 'Featured college (India)' : 'Featured college (Abroad)'}
              </p>
              <p className="mt-2 min-h-[2.75rem] text-lg font-semibold text-white md:min-h-[3.25rem] md:text-2xl">
                {text}
                <span className="ml-1 inline-block h-6 w-[2px] animate-pulse bg-gold-400 align-middle" />
              </p>
            </div>

            <p className="mt-5 max-w-2xl text-base text-blue-50/95 md:text-lg lg:ml-auto">
              {variant === 'india'
                ? 'Admission guidance for MBBS across India — counseling, college shortlisting, and documentation support.'
                : 'Trusted support for MBBS abroad — university selection, applications, and visa assistance end to end.'}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="primary" size="lg" className="group">
                Get Free Counselling
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="border-white/60 bg-white/15 text-white hover:bg-white/25"
              >
                {variant === 'india' ? 'Explore States' : 'Explore Countries'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
