/**
 * Bundled page hero images for Amplify (public/wp-content is mostly excluded from deploy).
 * Keys are SitePage / route slugs.
 */
export const PAGE_FEATURED_IMAGES: Record<string, string> = {
  mbbs: '/images/page-featured/mbbs.jpeg',
  'bams-in-india': '/images/page-featured/bams-in-india.jpeg',
  'md-ms': '/images/page-featured/md-ms.jpeg',
  'md-ms-colleges-in-uttar-pradesh': '/images/md-ms/up.jpeg',
  'md-ms-in-karnataka': '/images/md-ms/karnataka.jpeg',
  'md-ms-in-haryana': '/images/md-ms/haryana.jpeg',
  'md-ms-in-madhya-pradesh': '/images/md-ms/mp.jpeg',
  'md-ms-in-chhattisgarh': '/images/md-ms/chhattisgarh.jpeg',
  'md-ms-in-rajasthan': '/images/md-ms/rajasthan.jpeg',
  'md-ms-in-maharashtra': '/images/md-ms/maharashtra.jpeg',
  'md-ms-in-uttarakhand': '/images/md-ms/uttarakhand.jpeg',
  'md-ms-in-tamil-nadu': '/images/md-ms/tamil-nadu.jpeg',
};

export function resolvePageFeaturedImage(
  slug: string,
  fallback?: string | null
): string | null {
  const curated = PAGE_FEATURED_IMAGES[slug];
  if (curated) return curated;

  const trimmed = fallback?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/images/')) return trimmed;
  // College packs are present on Amplify; other /wp-content paths usually 404.
  if (/^\/wp-content\/uploads\/colleges\//i.test(trimmed)) return trimmed;
  if (/blob\.vercel-storage\.com/i.test(trimmed)) return trimmed;
  return curated ?? null;
}
