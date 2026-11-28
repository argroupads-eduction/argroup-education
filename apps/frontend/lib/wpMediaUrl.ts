const WP_MEDIA_HOST = /^(?:https?:)?\/\/(?:www\.)?argroupofeducation\.com/i;

/** Image uploaded on the live WordPress CMS, not a local college pack. */
export function isLiveCmsMediaUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    const host = new URL(url.trim()).hostname.replace(/^www\./i, '').toLowerCase();
    return host === 'cms.argroupofeducation.com';
  } catch {
    return false;
  }
}

export function liveCmsMediaUrl(url: string): string {
  return url.trim().replace(/^http:\/\//i, 'https://');
}

/** Live WordPress media host — used when public/wp-content miss on Hostinger. */
export const DEFAULT_WP_MEDIA_ORIGIN = 'https://cms.argroupofeducation.com';

/**
 * Amplify/Hostinger omit most of public/wp-content. Prefer bundled colleges + /images.
 * Misses rewrite to /api/wp-media which fetches from this origin (never self-proxy www).
 */
export function getWpMediaOrigin(): string | null {
  const raw = (process.env.WP_MEDIA_ORIGIN || process.env.NEXT_PUBLIC_WP_MEDIA_ORIGIN || '')
    .trim()
    .replace(/\/$/, '');
  const candidate = raw || DEFAULT_WP_MEDIA_ORIGIN;
  // Never treat this marketing Node app as a media CDN (self-proxy = slow).
  if (/hostingersite\.com/i.test(candidate)) return DEFAULT_WP_MEDIA_ORIGIN;
  try {
    const host = new URL(candidate).hostname.replace(/^www\./i, '').toLowerCase();
    if (host === 'argroupofeducation.com') return DEFAULT_WP_MEDIA_ORIGIN;
  } catch {
    return DEFAULT_WP_MEDIA_ORIGIN;
  }
  return candidate;
}

/**
 * Cloudflare cached many /wp-content/* misses as immutable 404s.
 * Serve WP uploads via /api/wp-media (proxy to cms) except on-disk college packs.
 */
export function preferApiWpMediaPath(pathname: string): string {
  if (!/^\/wp-content\/uploads\//i.test(pathname)) return pathname;
  if (/\/wp-content\/uploads\/colleges\//i.test(pathname)) return pathname;
  return pathname.replace(/^\/wp-content\//i, '/api/wp-media/');
}

function normalizeWpContentRel(rel: string): string {
  return rel.startsWith('wp-content/') ? `/${rel}` : `/wp-content/${rel.replace(/^\/+/, '')}`;
}

/** Local college packs live in public/wp-content/uploads/colleges — keep relative. */
function isBundledCollegeUpload(pathname: string): boolean {
  return /^\/?wp-content\/uploads\/colleges\//i.test(pathname);
}

/**
 * Always prefer same-origin /wp-content (public/ + /api/wp-media fallback).
 * Absolute www CDN URLs 404 because WP media is no longer on the apex host.
 */
function toLocalWpContentPath(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith('//')) {
    const absolute = pathOrUrl.startsWith('//')
      ? `https:${pathOrUrl}`
      : pathOrUrl.replace(/^http:\/\//i, 'https://');
    try {
      const u = new URL(absolute);
      const host = u.hostname.replace(/^www\./, '').toLowerCase();
      if (
        (host === 'argroupofeducation.com' || host.endsWith('hostingersite.com')) &&
        u.pathname.includes('/wp-content/')
      ) {
        return normalizeWpContentRel(u.pathname.replace(/^\/+/, ''));
      }
    } catch {
      /* fall through */
    }
  }
  if (pathOrUrl.startsWith('/wp-content/')) {
    return normalizeWpContentRel(pathOrUrl.replace(/^\/+/, ''));
  }
  if (isBundledCollegeUpload(pathOrUrl)) {
    return pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  }
  return pathOrUrl;
}

/** Legacy WP uploads → local /wp-content (public bundle + api fallback). */
export function resolveWpMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();
  if (trimmed.startsWith('/api/wp-media/')) {
    return trimmed;
  }
  if (trimmed.startsWith('/wp-content/')) {
    return preferApiWpMediaPath(toLocalWpContentPath(trimmed));
  }
  if (
    trimmed.startsWith('/images/') ||
    trimmed.startsWith('/ar-') ||
    trimmed.startsWith('/mbbs-') ||
    trimmed.startsWith('/states/')
  ) {
    return trimmed;
  }

  const withoutHost = trimmed.replace(WP_MEDIA_HOST, '');
  if (withoutHost !== trimmed) {
    const rel = withoutHost.replace(/^\/+/, '');
    if (rel.startsWith('wp-content/')) {
      return toLocalWpContentPath(normalizeWpContentRel(rel));
    }
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const host = new URL(trimmed).hostname.replace(/^www\./, '').toLowerCase();
      if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
        return null;
      }
      // WordPress CMS media → same-origin /api/wp-media (CDN-safe, indexable on www).
      if (host === 'cms.argroupofeducation.com') {
        try {
          const u = new URL(trimmed.replace(/^http:\/\//i, 'https://'));
          if (u.pathname.includes('/wp-content/')) {
            return preferApiWpMediaPath(
              toLocalWpContentPath(u.pathname)
            );
          }
        } catch {
          return trimmed.replace(/^http:\/\//i, 'https://');
        }
      }
      if (host === 'argroupofeducation.com' || host.endsWith('hostingersite.com')) {
        const u = new URL(trimmed.replace(/^http:\/\//i, 'https://'));
        if (u.pathname.includes('/wp-content/')) {
          return toLocalWpContentPath(u.pathname);
        }
      }
      if (
        host.endsWith('githubusercontent.com') ||
        host === 'github.com'
      ) {
        const localBlog = trimmed.match(/\/images\/blog\/([^/?#]+)$/i);
        if (localBlog?.[1]) return `/images/blog/${localBlog[1]}`;
        return trimmed.replace(/^http:\/\//i, 'https://');
      }
      if (
        host.endsWith('vercel-storage.com') ||
        host.endsWith('public.blob.vercel-storage.com')
      ) {
        return preferFullSizeVercelBlobUrl(
          trimmed.replace(/^http:\/\//i, 'https://')
        );
      }
    } catch {
      return null;
    }
    return null;
  }

  return trimmed;
}

export function preferFullSizeVercelBlobUrl(url: string): string {
  return url.replace(/-\d+x\d+-[A-Za-z0-9]+(\.(?:webp|jpe?g|png|gif))$/i, '$1');
}

export function rewriteSingleWpMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('/api/wp-media/')) {
    return trimmed;
  }

  const resolved = resolveWpMediaUrl(trimmed);
  if (resolved && resolved !== trimmed) return preferApiWpMediaPath(resolved);

  const hostMatch = trimmed.match(
    /^https?:\/\/(?:www\.)?(?:argroupofeducation\.com|[^/]*hostingersite\.com)\/wp-content\/(.+)$/i
  );
  if (hostMatch) {
    return preferApiWpMediaPath(
      toLocalWpContentPath(normalizeWpContentRel(`wp-content/${hostMatch[1]}`))
    );
  }

  // Live WordPress CMS media → same-origin API proxy (indexable on www, bypasses CF 404 poison)
  const cmsMatch = trimmed.match(
    /^https?:\/\/cms\.argroupofeducation\.com\/wp-content\/(.+)$/i
  );
  if (cmsMatch) {
    return preferApiWpMediaPath(
      toLocalWpContentPath(normalizeWpContentRel(`wp-content/${cmsMatch[1]}`))
    );
  }

  if (trimmed.startsWith('/wp-content/')) {
    return preferApiWpMediaPath(
      toLocalWpContentPath(normalizeWpContentRel(trimmed.replace(/^\/+/, '')))
    );
  }

  return trimmed;
}

/** Rewrite legacy WP media URLs inside prepared HTML (src, href, srcset, lazy attrs). */
export function rewriteWpMediaUrlsInHtml(html: string): string {
  if (!html || !/wp-content\//i.test(html)) return html;

  let out = html.replace(
    /(\b(?:src|href|data-src|data-lazy-src)=["'])([^"']+)(["'])/gi,
    (_match, before: string, url: string, after: string) =>
      `${before}${rewriteSingleWpMediaUrl(url)}${after}`
  );

  out = out.replace(/\bsrcset=["']([^"']+)["']/gi, (_match, srcset: string) => {
    const rewritten = srcset
      .split(',')
      .map((part) => {
        const bits = part.trim().split(/\s+/);
        const url = bits[0] ?? '';
        const descriptor = bits.slice(1).join(' ');
        const next = rewriteSingleWpMediaUrl(url);
        return descriptor ? `${next} ${descriptor}` : next;
      })
      .join(', ');
    return `srcset="${rewritten}"`;
  });

  return out;
}
