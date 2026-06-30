/** Curated blog hero images when CMS/DB has no featuredImage set. */
export const BLOG_FEATURED_IMAGES: Record<string, string> = {
  'top-medical-colleges-in-india': '/images/blog/top-medical-colleges-india-2026-banner.png',
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
  return BLOG_FEATURED_IMAGES[slug] ?? fallback ?? null;
}

export function resolveBlogPublishedAt(
  slug: string,
  fallback: string | null | undefined
): string | null {
  return BLOG_PUBLISHED_AT[slug] ?? fallback ?? null;
}
