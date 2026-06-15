import { getCollegeImageBySlug } from '@/lib/collegeImageIndex';
import { rewriteSingleWpMediaUrl, resolveWpMediaUrl } from '@/lib/wpMediaUrl';

const SKIP_IMG = /wpforms|submit-spin|\.svg(?:\?|$)|emoji|gravatar|pixel|tracking/i;
const BUNDLED_COLLEGE_IMG = /\/uploads\/colleges\//i;
const BUNDLED_SCROLL_IMG = /\/mbbs-abroad-scroll\//i;

function isBundledHeroImage(url: string | null | undefined): boolean {
  if (!url) return false;
  return BUNDLED_COLLEGE_IMG.test(url) || BUNDLED_SCROLL_IMG.test(url);
}

/** Old CMS uploads in page body — replace with bundled college/country heroes when available. */
function isStaleWpUpload(url: string | null | undefined): boolean {
  if (!url) return false;
  if (isBundledHeroImage(url)) return false;
  return /wp-content\/uploads|\/api\/wp-media\/uploads/i.test(url);
}

function pickImageSrc(
  currentSrc: string | undefined,
  pageSlug: string | null | undefined,
  featuredImage: string | null | undefined
): string | null {
  const fromSlug = getCollegeImageBySlug(pageSlug);
  const fromFeatured = resolveWpMediaUrl(featuredImage);
  const fromCurrent = currentSrc ? rewriteSingleWpMediaUrl(currentSrc) : null;

  if (isStaleWpUpload(fromCurrent)) {
    if (isBundledHeroImage(fromSlug)) return fromSlug;
    if (isBundledHeroImage(fromFeatured)) return fromFeatured;
  }

  if (fromCurrent?.startsWith('/api/wp-media/') || fromCurrent?.startsWith('/wp-content/')) {
    return fromCurrent;
  }
  if (fromSlug) return fromSlug;
  if (fromFeatured) return fromFeatured;
  return fromCurrent;
}

/** Ensure every content <img> uses a single working local/API src (no broken srcset). */
export function normalizeContentImagesInHtml(
  html: string,
  options?: { pageSlug?: string | null; featuredImage?: string | null }
): string {
  if (!html?.includes('<img')) return html;

  return html.replace(/<img\b([^>]*?)>/gi, (match, attrs: string) => {
    if (SKIP_IMG.test(attrs)) return match;

    const srcMatch = attrs.match(/\bsrc=["']([^"']*)["']/i);
    const currentSrc = srcMatch?.[1];
    const resolved = pickImageSrc(currentSrc, options?.pageSlug, options?.featuredImage);
    if (!resolved) return match;

    const clean = attrs
      .replace(/\ssrcset=["'][^"']*["']/gi, '')
      .replace(/\ssizes=["'][^"']*["']/gi, '')
      .replace(/\ssrc=["'][^"']*["']/gi, '');

    return `<img src="${resolved}"${clean}>`;
  });
}
