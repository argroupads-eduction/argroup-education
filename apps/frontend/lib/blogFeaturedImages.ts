import { BLOG_SLUG_CANONICAL } from '@/lib/blogUtils';
import { getCollegeImageBySlug } from '@/lib/collegeImageIndex';
import { resolveWpMediaUrl } from '@/lib/wpMediaUrl';
import blogFeaturedMap from '../data/blog-featured-map.json';

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
  'NEET PG Exam 2026': '/images/blog/neet-pg-exam-2026.png',
  'neet-pg-exam-2026': '/images/blog/neet-pg-exam-2026.png',
  'affordable-medical-universities-abroad':
    '/images/blog/affordable-medical-universities-abroad.png',
  'score-is-needed-in-neet':
    '/images/blog/how-much-score-needed-neet-2026-full-cut-off-analysis.png',
  'medical-colleges-accepting-low-neet-score-2026':
    '/images/blog/medical-colleges-accepting-low-neet-score-2026.png',
  'how-to-get-mbbs-with-a-low-neet-score-in-2026':
    '/images/blog/how-to-get-mbbs-with-a-low-neet-score-in-2026.png',
  'mbbs-with-low-neet-score-2026':
    '/images/blog/how-to-get-mbbs-with-a-low-neet-score-in-2026.png',
  'mbbs-admission-through-management-quota':
    '/images/blog/mbbs-admission-through-management-quota-2026.png',
  'mbbs-admission-2026-without-donation':
    '/images/blog/mbbs-admission-2026-without-donation.png',
  'mbbs-admission-without-donation-2026':
    '/images/blog/mbbs-admission-2026-without-donation.png',
  'mbbs-drop-year-strategy-neet-2026':
    '/images/blog/mbbs-drop-year-strategy-neet-2026.png',
  'marks-are-required-in-neet-for-mbbs':
    '/images/blog/how-many-marks-are-required-in-neet-for-mbbs-v2.png',
  'marks-required-in-neet-for-mbbs-2026':
    '/images/blog/how-many-marks-are-required-in-neet-for-mbbs-v2.png',
  'mbbs-with-300-marks-in-neet': '/images/blog/mbbs-with-300-marks-in-neet-v2.png',
  'mbbs-with-300-marks-in-neet-2026': '/images/blog/mbbs-with-300-marks-in-neet-v2.png',
  'score-needed-in-neet-2026':
    '/images/blog/how-much-score-needed-neet-2026-full-cut-off-analysis.png',
  ...((blogFeaturedMap as { map?: Record<string, string> }).map ?? {}),
};

/** Editorial publish dates for bundle-managed posts (overrides stale CMS/API copies). */
export const BLOG_PUBLISHED_AT: Record<string, string> = {
  'top-medical-colleges-in-india': '2026-06-22T09:00:00',
};

function normalizeBlogSlugKey(slug: string): string {
  return slug.trim().toLowerCase().replace(/\s+/g, ' ');
}

function curatedFeaturedImage(slug: string): string | null {
  if (BLOG_FEATURED_IMAGES[slug]) return BLOG_FEATURED_IMAGES[slug];

  const normalized = normalizeBlogSlugKey(slug);
  for (const [key, src] of Object.entries(BLOG_FEATURED_IMAGES)) {
    if (normalizeBlogSlugKey(key) === normalized) return src;
  }

  for (const [legacySlug, canonicalSlug] of Object.entries(BLOG_SLUG_CANONICAL)) {
    if (canonicalSlug === slug && BLOG_FEATURED_IMAGES[legacySlug]) {
      return BLOG_FEATURED_IMAGES[legacySlug];
    }
  }

  return null;
}

/** CMS/Strapi URLs that must win over local curated fallbacks. */
function isTrustedCmsFeaturedUrl(url: string): boolean {
  // Persisted Media Library bytes on www — always preferred
  if (/\/api\/cms\/media\/[a-f0-9]+/i.test(url)) return true;
  // Strapi Hostinger /uploads often 404 after redeploy — do NOT trust as hero source
  if (/hostingersite\.com/i.test(url)) return false;
  if (/blob\.vercel-storage\.com/i.test(url)) return true;
  if (/res\.cloudinary\.com/i.test(url)) return true;
  if (/githubusercontent\.com|github\.com/i.test(url)) return true;
  // Site-owned absolute media (not the old broken WP CDN guesses)
  if (/argroupofeducation\.com\/uploads\//i.test(url)) return true;
  if (/argroupofeducation\.com\/api\/cms\/media\//i.test(url)) return true;
  return false;
}

function isBrokenFeaturedFallback(url: string): boolean {
  return /getmyuniversity\.com/i.test(url);
}

export function resolveBlogFeaturedImage(
  slug: string,
  fallback: string | null | undefined
): string | null {
  const trimmed = fallback?.trim();

  // Strapi / CMS featured image always wins when present and trusted.
  // Curated maps are fallback only — never override an admin upload.
  if (trimmed && !isBrokenFeaturedFallback(trimmed)) {
    // Persisted Media Library bytes served from www
    if (/\/api\/cms\/media\/[a-f0-9]+/i.test(trimmed)) {
      try {
        if (/^https?:\/\//i.test(trimmed)) {
          const u = new URL(trimmed.replace(/^http:\/\//i, 'https://'));
          return u.pathname;
        }
      } catch {
        /* keep */
      }
      return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    }

    if (/^https?:\/\//i.test(trimmed) && isTrustedCmsFeaturedUrl(trimmed)) {
      const httpsUrl = trimmed.replace(/^http:\/\//i, 'https://');
      // Never rewrite GitHub/CDN absolutes to /images/... (path may contain that substring).
      if (
        /githubusercontent\.com|github\.com|jsdelivr\.net/i.test(httpsUrl) ||
        /hostingersite\.com/i.test(httpsUrl) ||
        /\/uploads\//i.test(httpsUrl) ||
        /blog-heroes\//i.test(httpsUrl)
      ) {
        return httpsUrl;
      }
      try {
        const pathName = new URL(httpsUrl).pathname;
        if (pathName.startsWith('/images/')) return pathName;
        if (pathName.includes('/wp-content/')) {
          return pathName.slice(pathName.indexOf('/wp-content/'));
        }
      } catch {
        /* keep absolute */
      }
      return httpsUrl;
    }

    // Only rewrite relative/same-bundle paths — never strip GitHub/CDN absolutes to local.
    const bundledBlogFile =
      !/^https?:\/\//i.test(trimmed) &&
      trimmed.match(/\/images\/blog\/([^/?#]+)(\?[^#]*)?$/i);
    if (bundledBlogFile) {
      const file = bundledBlogFile[1];
      return file.toLowerCase().endsWith('.webp')
        ? `/images/blog/${file}?v=3`
        : `/images/blog/${file}`;
    }

    if (trimmed.startsWith('/images/')) return trimmed;

    if (/^https?:\/\//i.test(trimmed)) {
      if (
        /blob\.vercel-storage\.com/i.test(trimmed) ||
        /argroupofeducation\.com/i.test(trimmed) ||
        /hostingersite\.com/i.test(trimmed) ||
        /res\.cloudinary\.com/i.test(trimmed) ||
        /githubusercontent\.com/i.test(trimmed) ||
        /github\.com/i.test(trimmed)
      ) {
        return trimmed.replace(/^http:\/\//i, 'https://');
      }
    }

    const resolvedFallback = resolveWpMediaUrl(fallback);
    if (resolvedFallback?.startsWith('/images/')) return resolvedFallback;
    if (resolvedFallback) {
      if (/blob\.vercel-storage\.com/i.test(resolvedFallback)) return resolvedFallback;
      if (resolvedFallback.startsWith('/wp-content/')) return resolvedFallback;
      // Prefer trusted CMS absolutes over curated
      if (/^https?:\/\//i.test(resolvedFallback) && isTrustedCmsFeaturedUrl(resolvedFallback)) {
        return resolvedFallback;
      }
      return resolvedFallback;
    }
  }

  return curatedFeaturedImage(slug) || getCollegeImageBySlug(slug);
}

export function resolveBlogPublishedAt(
  slug: string,
  fallback: string | null | undefined
): string | null {
  if (fallback) return fallback;
  return BLOG_PUBLISHED_AT[slug] ?? null;
}
