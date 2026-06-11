import { MBBS_INDIA_STATES } from '@/lib/mbbsIndiaTree';

/** Local state landmark heroes — full image visible, no crop (see public/states/). */
export const MBBS_INDIA_STATE_FEATURED_IMAGES: Record<string, string> = {
  'mbbs-in-india': '/states/mbbs-in-india.png',
  'mbbs-in-delhi': '/states/delhi.png',
  'mbbs-in-up': '/states/uttar-pradesh.png',
  'mbbs-in-haryana': '/states/haryana.png',
  'mbbs-in-rajasthan': '/states/rajasthan.png',
  'mbbs-in-maharashtra': '/states/maharashtra.png',
  'mbbs-in-karnataka': '/states/karnataka.png',
  'mbbs-in-madhya-pradesh': '/states/madhya-pradesh.png',
  'mbbs-in-bihar': '/states/bihar.png',
  'mbbs-in-uttarakhand': '/states/uttarakhand.png',
  'mbbs-in-himachal-pradesh': '/states/himachal-pradesh.png',
  'mbbs-in-jharkhand': '/states/jharkhand.png',
  'mbbs-in-chhattisgarh': '/states/chhattisgarh.png',
  'mbbs-in-sikkim': '/states/sikkim.png',
  'mbbs-in-pondicherry': '/states/pondicherry.png',
  'mbbs-in-kerala': '/states/kerala.png',
  'mbbs-in-west-bengal': '/states/west-bengal.png',
  'mbbs-in-tamil-nadu': '/states/tamil-nadu.png',
};

export function getMbbsIndiaStateFeaturedImage(wpSlug: string | null | undefined): string | null {
  if (!wpSlug) return null;
  return MBBS_INDIA_STATE_FEATURED_IMAGES[wpSlug] ?? null;
}

export function resolveMbbsIndiaFeaturedImage(
  wpSlug: string | null | undefined,
  fallback: string | null | undefined
): string | null {
  return getMbbsIndiaStateFeaturedImage(wpSlug) ?? fallback ?? null;
}

const MBBS_INDIA_HREF_TO_WP_SLUG: Record<string, string> = Object.fromEntries(
  MBBS_INDIA_STATES.flatMap((state) => {
    if (!state.wpSlug) return [];
    return [
      [state.href.toLowerCase(), state.wpSlug],
      [`/mbbs-india/${state.id}`.toLowerCase(), state.wpSlug],
    ];
  })
);

function resolveMbbsIndiaSlugFromHref(href: string): string | null {
  const legacy = href.match(/mbbs-in-[a-z0-9-]+/i);
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
  return MBBS_INDIA_HREF_TO_WP_SLUG[normalized] ?? null;
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

function isReplaceableStateContentImage(attrs: string, src: string): boolean {
  if (!src || src.startsWith('/states/')) return false;
  if (/\.svg(\?|$)/i.test(src)) return false;
  if (/icon|logo|emoji|avatar/i.test(src)) return false;
  if (isCollegeThumbSrc(src)) return false;
  if (/\bwidth\s*=\s*["'](?:[1-9]|[1-9]\d)["']/i.test(attrs)) return false;
  return /wp-content\/uploads/i.test(src);
}

/** Hub grid: each state tile link → matching landmark image. */
export function replaceMbbsIndiaStateGridImages(html: string): string {
  return html.replace(
    /<a\b([^>]*?)href=["']([^"']+)["']([^>]*?)>([\s\S]*?)<\/a>/gi,
    (full, aBefore, href, aAfter, inner) => {
      const slug = resolveMbbsIndiaSlugFromHref(href);
      if (!slug) return full;
      const stateImage = getMbbsIndiaStateFeaturedImage(slug);
      if (!stateImage || !/<img\b/i.test(inner)) return full;

      const newInner = inner.replace(/<img\b([^>]*)>/i, (_img: string, imgAttrs: string) => {
        const cleaned = stripResponsiveImgAttrs(imgAttrs);
        return `<img${cleaned} src="${stateImage}" loading="lazy" decoding="async" class="wp-state-landmark-img">`;
      });
      return `<a${aBefore}href="${href}"${aAfter}>${newInner}</a>`;
    }
  );
}

/** State page body: swap old WP stock photos with the state landmark (keep college thumbs). */
export function replaceStatePageContentImages(html: string, stateImage: string): string {
  if (!stateImage?.trim()) return html;

  return html.replace(/<img\b([^>]*)>/gi, (full, attrs) => {
    const srcMatch = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch || !isReplaceableStateContentImage(attrs, srcMatch[1])) return full;

    const cleaned = stripResponsiveImgAttrs(attrs);
    return `<img${cleaned} src="${stateImage}" loading="lazy" decoding="async" class="wp-state-landmark-img">`;
  });
}

/** Hub intro: drop duplicate image block between Key Highlights and body copy (keep top featured image). */
export function stripMbbsIndiaHubBodyHeroImage(html: string, pageWpSlug?: string | null): string {
  if (pageWpSlug !== 'mbbs-in-india') return html;
  return html.replace(
    /<section\b[^>]*\belementor-element-e05d4e3\b[^>]*>[\s\S]*?<\/section>\s*/i,
    ''
  );
}

/** Apply grid + per-page landmark swaps for MBBS India CMS HTML. */
export function injectMbbsIndiaStateImages(html: string, pageWpSlug?: string | null): string {
  let out = replaceMbbsIndiaStateGridImages(html);

  if (pageWpSlug === 'mbbs-in-india') {
    out = stripMbbsIndiaHubBodyHeroImage(out, pageWpSlug);
  } else if (pageWpSlug) {
    const stateImage = getMbbsIndiaStateFeaturedImage(pageWpSlug);
    if (stateImage) out = replaceStatePageContentImages(out, stateImage);
  }

  return out;
}

/** @deprecated Use injectMbbsIndiaStateImages */
export function replaceMbbsIndiaStateBodyImage(html: string, stateImage: string | null): string {
  if (!stateImage) return html;
  return replaceStatePageContentImages(html, stateImage);
}
