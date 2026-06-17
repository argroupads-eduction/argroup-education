/** Curated blog hero images when CMS/DB has no featuredImage set. */
export const BLOG_FEATURED_IMAGES: Record<string, string> = {
  'neet-re-exam-2026-vs-original-exam-which-is-tougher':
    '/images/blog/neet-re-exam-2026-vs-original-exam-which-is-tougher.png',
  'neet-re-exam-2026-vs-original-exam':
    '/images/blog/neet-re-exam-2026-vs-original-exam-which-is-tougher.png',
  'study-low-cost-mbbs-in-india': '/images/blog/study-low-cost-mbbs-in-india.png',
};

export function resolveBlogFeaturedImage(
  slug: string,
  fallback: string | null | undefined
): string | null {
  return BLOG_FEATURED_IMAGES[slug] ?? fallback ?? null;
}
