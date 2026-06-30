import { BLOG_SLUG_CANONICAL } from '@/lib/blogUtils';

/** Curated blog hero images when CMS/DB has no featuredImage set. */
export const BLOG_FEATURED_IMAGES: Record<string, string> = {
  'top-medical-colleges-in-india': '/images/blog/top-medical-colleges-india-2026-banner.png',
  'can-i-get-mbbs-with-250-marks-in-neet-complete-admission-guide-2026':
    '/images/blog/can-i-get-mbbs-with-250-marks-in-neet-complete-admission-guide-2026.png',
  'can-i-get-mbbs-with-250-marks-in-neet':
    '/images/blog/can-i-get-mbbs-with-250-marks-in-neet-complete-admission-guide-2026.png',
  'how-much-neet-score-is-required-for-mbbs-in-russia-complete-guide-2026':
    '/images/blog/how-much-neet-score-required-mbbs-russia-complete-guide-2026.png',
  'mbbs-in-russia': '/images/blog/how-much-neet-score-required-mbbs-russia-complete-guide-2026.png',
  'neet-re-exam-2026-vs-original-exam-which-is-tougher':
    '/images/blog/neet-re-exam-2026-vs-original-exam-which-is-tougher.png',
  'neet-re-exam-2026-vs-original-exam':
    '/images/blog/neet-re-exam-2026-vs-original-exam-which-is-tougher.png',
  'study-low-cost-mbbs-in-india': '/images/blog/study-low-cost-mbbs-in-india.png',
};

/** Editorial publish dates for bundle-managed posts (overrides stale CMS/API copies). */
export const BLOG_PUBLISHED_AT: Record<string, string> = {
  'top-medical-colleges-in-india': '2026-06-22T09:00:00',
};

export function resolveBlogFeaturedImage(
  slug: string,
  fallback: string | null | undefined
): string | null {
  if (BLOG_FEATURED_IMAGES[slug]) return BLOG_FEATURED_IMAGES[slug];

  for (const [legacySlug, canonicalSlug] of Object.entries(BLOG_SLUG_CANONICAL)) {
    if (canonicalSlug === slug && BLOG_FEATURED_IMAGES[legacySlug]) {
      return BLOG_FEATURED_IMAGES[legacySlug];
    }
  }

  return fallback ?? null;
}

export function resolveBlogPublishedAt(
  slug: string,
  fallback: string | null | undefined
): string | null {
  if (fallback) return fallback;
  return BLOG_PUBLISHED_AT[slug] ?? null;
}
