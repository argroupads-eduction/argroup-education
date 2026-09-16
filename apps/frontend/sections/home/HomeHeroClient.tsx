'use client';

import { HeroSection } from '@/sections/home/HeroSection';

/**
 * Client boundary for the homepage hero.
 * Keep as a direct import (no `dynamic(..., { ssr: false })`) so SSR HTML
 * matches the first client paint and avoids loadable/Suspense hydration errors.
 */
export function HomeHeroClient() {
  return <HeroSection />;
}
