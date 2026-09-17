const WP_MEDIA_HOST = /^(?:https?:)?\/\/(?:www\.)?argroupofeducation\.com/i;

/**
 * Amplify omits most of public/wp-content. Prefer bundled colleges + /images + /mbbs-* heroes.
 * Do NOT hotlink Hostinger Node (returns HTML for /wp-content). Keep same-origin paths so
 * next.config can rewrite misses to /api/wp-media when a real origin is configured.
 */
export function getWpMediaOrigin(): string | null {
  const raw = (process.env.WP_MEDIA_ORIGIN || process.env.NEXT_PUBLIC_WP_MEDIA_ORIGIN || '')
    .trim()
    .replace(/\/$/, '');
  if (!raw) return null;
  // khaki-mole Node app is the marketing site, not a WP media host.
  if (/hostingersite\.com/i.test(raw)) return null;
  return raw;
}

/** Bundled uploads in public/wp-content — static path for Next.js. */
function toStaticWpContentPath(relativePath: string): string {
  const safe = relativePath.replace(/^\/+/, '').replace(/^wp-content\//, '');
  return `/wp-content/${safe}`;
}

function apiMediaToStatic(url: string): string {
  return toStaticWpContentPath(url.replace(/^\/api\/wp-media\//, ''));
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
    return apiMediaToStatic(trimmed);
  }
  if (trimmed.startsWith('/wp-content/')) {
    return toLocalWpContentPath(trimmed);
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
      if (host === 'argroupofeducation.com' || host.endsWith('hostingersite.com')) {
        const u = new URL(trimmed.replace(/^http:\/\//i, 'https://'));
        if (u.pathname.includes('/wp-content/')) {
          return toLocalWpContentPath(u.pathname);
        }
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
    return apiMediaToStatic(trimmed);
  }

  const resolved = resolveWpMediaUrl(trimmed);
  if (resolved && resolved !== trimmed) return resolved;

  const hostMatch = trimmed.match(
    /^https?:\/\/(?:www\.)?(?:argroupofeducation\.com|[^/]*hostingersite\.com)\/wp-content\/(.+)$/i
  );
  if (hostMatch) {
    return toLocalWpContentPath(normalizeWpContentRel(`wp-content/${hostMatch[1]}`));
  }

  if (trimmed.startsWith('/wp-content/')) {
    return toLocalWpContentPath(normalizeWpContentRel(trimmed.replace(/^\/+/, '')));
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
