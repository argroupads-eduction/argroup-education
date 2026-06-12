import { getCollegeImageBySlug } from '@/lib/collegeImageIndex';
import { rewriteSingleWpMediaUrl, resolveWpMediaUrl } from '@/lib/wpMediaUrl';

const SKIP_IMG = /wpforms|submit-spin|\.svg(?:\?|$)|emoji|gravatar|pixel|tracking/i;

function pickImageSrc(
  currentSrc: string | undefined,
  pageSlug: string | null | undefined,
  featuredImage: string | null | undefined
): string | null {
  const fromSlug = getCollegeImageBySlug(pageSlug);
  const fromFeatured = resolveWpMediaUrl(featuredImage);
  const fromCurrent = currentSrc ? rewriteSingleWpMediaUrl(currentSrc) : null;

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
