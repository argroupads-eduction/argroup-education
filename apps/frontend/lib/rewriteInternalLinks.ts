import linkIndex from '@/data/wp-link-index.json';
import { blogPostPath } from '@/lib/blogUtils';

const LEGACY_HOST = /^(www\.)?argroupofeducation\.com$/i;

/** Old WP contact landing pages → live contact route. */
const LEGACY_CONTACT_SLUGS = new Set([
  'contact-ar-group-of-education-mbbs-admission-help',
  'contact-us',
  'contact-ar-group-of-education',
]);

function isLegacyContactSlug(slug: string): boolean {
  if (LEGACY_CONTACT_SLUGS.has(slug)) return true;
  return slug.startsWith('contact-ar-group');
}

const WP_SLUG_TO_PATH: Record<string, string> = linkIndex.wpSlugToPath;
const PAGE_SLUGS = new Set(linkIndex.pageSlugs);
const POST_SLUGS = new Set(linkIndex.postSlugs);

function encodePathSegments(slugPath: string): string {
  return slugPath
    .split('/')
    .filter(Boolean)
    .map((s) => encodeURIComponent(s))
    .join('/');
}

/** Map a legacy WP path slug to the matching Next.js route. */
export function resolveInternalPath(slugPath: string): string {
  const normalized = slugPath.replace(/^\/+|\/+$/g, '');
  if (!normalized) return '/';

  if (isLegacyContactSlug(normalized)) return '/contact';

  if (WP_SLUG_TO_PATH[normalized]) return WP_SLUG_TO_PATH[normalized];

  if (POST_SLUGS.has(normalized) && !PAGE_SLUGS.has(normalized)) {
    return blogPostPath(normalized);
  }

  return `/${encodePathSegments(normalized)}`;
}

/** Rewrite argroupofeducation.com (and legacy relative) URLs to local routes. */
export function resolveInternalHref(href: string): string {
  const raw = href.trim();
  if (!raw) return raw;
  if (
    raw.startsWith('#') ||
    raw.startsWith('mailto:') ||
    raw.startsWith('tel:') ||
    raw.startsWith('javascript:') ||
    raw.startsWith('data:')
  ) {
    return raw;
  }

  let pathname = '';
  let suffix = '';

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      if (!LEGACY_HOST.test(url.hostname)) return raw;
      pathname = url.pathname;
      suffix = `${url.search}${url.hash}`;
    } catch {
      return raw;
    }
  } else if (raw.startsWith('//')) {
    return raw;
  } else if (raw.startsWith('/')) {
    pathname = raw.split(/[?#]/)[0] ?? raw;
    const q = raw.indexOf('?');
    const h = raw.indexOf('#');
    if (q >= 0 || h >= 0) {
      suffix = raw.slice(Math.min(q >= 0 ? q : raw.length, h >= 0 ? h : raw.length));
    }
  } else {
    pathname = `/${raw.split(/[?#]/)[0]}`;
    const q = raw.indexOf('?');
    const h = raw.indexOf('#');
    if (q >= 0 || h >= 0) {
      suffix = raw.slice(Math.min(q >= 0 ? q : raw.length, h >= 0 ? h : raw.length));
    }
  }

  const slugPath = pathname.replace(/^\/+|\/+$/g, '');
  return `${resolveInternalPath(slugPath)}${suffix}`;
}

const HREF_ATTR_RE = /(\bhref\s*=\s*)(["'])([^"']+)\2/gi;

/** Rewrite all internal anchors in migrated WP HTML. */
export function rewriteInternalLinks(html: string): string {
  if (!html || !/argroupofeducation\.com|href\s*=/i.test(html)) return html;

  return html.replace(HREF_ATTR_RE, (match, prefix, quote, href) => {
    const next = resolveInternalHref(href);
    if (next === href) return match;
    return `${prefix}${quote}${next}${quote}`;
  });
}
