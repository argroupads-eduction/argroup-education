import { MBBS_ABROAD_COUNTRIES } from '@/lib/mbbsAbroadTree';

/** Local country landmark heroes — full image visible (see public/mbbs-*-hero.png). */
export const MBBS_ABROAD_COUNTRY_FEATURED_IMAGES: Record<string, string> = {
  'study-mbbs-in-bangladesh': '/mbbs-bangladesh-hero.png',
  'mbbs-in-serbia': '/mbbs-serbia-hero.png',
  'mbbs-in-iran': '/mbbs-iran-hero.png',
  'mbbs-in-bosnia': '/mbbs-bosnia-hero.png',
  'mbbs-in-egypt': '/mbbs-egypt-hero.png',
  'mbbs-in-vietnam': '/mbbs-vietnam-hero.png',
  'study-mbbs-in-kyrgyzstan': '/mbbs-kyrgyzstan-hero.png',
  'mbbs-in-philippines-3-2': '/mbbs-philippines-hero.png',
  'study-mbbs-in-china': '/mbbs-china-hero.png',
  'mbbs-in-romania': '/mbbs-romania-hero.png',
};

export function getMbbsAbroadCountryFeaturedImage(wpSlug: string | null | undefined): string | null {
  if (!wpSlug) return null;
  return MBBS_ABROAD_COUNTRY_FEATURED_IMAGES[wpSlug] ?? null;
}

export function resolveMbbsAbroadFeaturedImage(
  wpSlug: string | null | undefined,
  fallback: string | null | undefined
): string | null {
  return getMbbsAbroadCountryFeaturedImage(wpSlug) ?? fallback ?? null;
}

const MBBS_ABROAD_HREF_TO_WP_SLUG: Record<string, string> = Object.fromEntries(
  MBBS_ABROAD_COUNTRIES.flatMap((country) => {
    if (!country.wpSlug) return [];
    return [[country.href.toLowerCase(), country.wpSlug]];
  })
);

function resolveMbbsAbroadSlugFromHref(href: string): string | null {
  const legacy = href.match(/study-mbbs-in-[a-z0-9-]+|mbbs-in-[a-z0-9-]+/i);
  if (legacy) return legacy[0].toLowerCase();

  const path = (() => {
    try {
      if (/^https?:\/\//i.test(href)) return new URL(href).pathname;
    } catch {
      /* ignore */
    }
    return href.split(/[?#]/)[0] ?? href;
  })();

  const normalized = path.replace(/\/+$/, '').toLowerCase();
  const fromTree = MBBS_ABROAD_HREF_TO_WP_SLUG[normalized];
  if (fromTree) return fromTree;

  const segment = normalized.match(/\/mbbs-abroad\/([a-z0-9-]+)/i)?.[1];
  if (!segment) return null;
  return MBBS_ABROAD_COUNTRIES.find((c) => c.id === segment)?.wpSlug ?? null;
}

function stripResponsiveImgAttrs(attrs: string): string {
  return attrs
    .replace(/\bsrc\s*=\s*["'][^"']+["']/i, '')
    .replace(/\bsrcset\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bsizes\s*=\s*["'][^"']*["']/gi, '');
}

function isCollegeThumbSrc(src: string): boolean {
  return /elementor\/thumbs|\/thumb(?:s)?\//i.test(src);
}

function isReplaceableCountryContentImage(attrs: string, src: string): boolean {
  if (!src || src.startsWith('/mbbs-')) return false;
  if (/\.svg(\?|$)/i.test(src)) return false;
  if (/icon|logo|emoji|avatar/i.test(src)) return false;
  if (isCollegeThumbSrc(src)) return false;
  if (/\bwidth\s*=\s*["'](?:[1-9]|[1-9]\d)["']/i.test(attrs)) return false;
  return /wp-content\/uploads/i.test(src);
}

/** Hub grid: each country tile link → matching landmark image. */
export function replaceMbbsAbroadCountryGridImages(html: string): string {
  return html.replace(
    /<a\b([^>]*?)href=["']([^"']+)["']([^>]*?)>([\s\S]*?)<\/a>/gi,
    (full, aBefore, href, aAfter, inner) => {
      const slug = resolveMbbsAbroadSlugFromHref(href);
      if (!slug) return full;
      const countryImage = getMbbsAbroadCountryFeaturedImage(slug);
      if (!countryImage || !/<img\b/i.test(inner)) return full;

      const newInner = inner.replace(/<img\b([^>]*)>/i, (_img: string, imgAttrs: string) => {
        const cleaned = stripResponsiveImgAttrs(imgAttrs);
        return `<img${cleaned} src="${countryImage}" loading="lazy" decoding="async" class="wp-country-landmark-img">`;
      });
      return `<a${aBefore}href="${href}"${aAfter}>${newInner}</a>`;
    }
  );
}

/** Country page body: swap old WP stock photos with the country landmark (keep college thumbs). */
export function replaceAbroadCountryPageContentImages(html: string, countryImage: string): string {
  if (!countryImage?.trim()) return html;

  return html.replace(/<img\b([^>]*)>/gi, (full, attrs) => {
    const srcMatch = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch || !isReplaceableCountryContentImage(attrs, srcMatch[1])) return full;

    const cleaned = stripResponsiveImgAttrs(attrs);
    return `<img${cleaned} src="${countryImage}" loading="lazy" decoding="async" class="wp-country-landmark-img">`;
  });
}

/** Apply grid + per-page landmark swaps for MBBS Abroad CMS HTML. */
export function injectMbbsAbroadCountryImages(html: string, pageWpSlug?: string | null): string {
  let out = replaceMbbsAbroadCountryGridImages(html);

  if (pageWpSlug) {
    const countryImage = getMbbsAbroadCountryFeaturedImage(pageWpSlug);
    if (countryImage) out = replaceAbroadCountryPageContentImages(out, countryImage);
  }

  return out;
}
