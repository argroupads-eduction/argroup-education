'use client';

import { HeroSection } from '@/sections/home/HeroSection';

/**
 * Client boundary for the homepage hero.
 * Rendered with SSR (no `dynamic(..., { ssr: false })`) so reload does not
 * flash an empty banner shell then jump when JS hydrates.
 */
export function HomeHeroClient() {
  return <HeroSection />;
}
