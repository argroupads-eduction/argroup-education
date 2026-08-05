'use client';

import dynamic from 'next/dynamic';

/**
 * Client boundary so we can use `ssr: false`.
 * Avoids Next/webpack HMR leaving a stale Image className that fights SSR HTML.
 */
const HeroSection = dynamic(
  () => import('@/sections/home/HeroSection').then((m) => ({ default: m.HeroSection })),
  {
    ssr: false,
    loading: () => (
      <div
        className="relative min-h-[32rem] overflow-hidden bg-navy-900 sm:min-h-[36rem] md:min-h-[42rem] lg:min-h-[48rem] xl:min-h-[52rem]"
        style={{
          backgroundImage: "url('/hero-banner-aug4.webp')",
          backgroundSize: 'cover',
          backgroundPosition: '62% center',
        }}
        aria-hidden
      />
    ),
  }
);

export function HomeHeroClient() {
  return <HeroSection />;
}
