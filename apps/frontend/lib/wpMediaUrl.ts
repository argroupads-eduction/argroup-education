const WP_MEDIA_HOST = /^(?:https?:)?\/\/(?:www\.)?argroupofeducation\.com/i;

/**
 * Amplify omits most of public/wp-content. Hostinger still serves the full WP uploads tree.
 * Override with WP_MEDIA_ORIGIN when the temporary Hostinger hostname changes.
 */
const DEFAULT_WP_MEDIA_ORIGIN = 'https://khaki-mole-453413.hostingersite.com';

export function getWpMediaOrigin(): string {
  return (
    process.env.WP_MEDIA_ORIGIN ||
    process.env.NEXT_PUBLIC_WP_MEDIA_ORIGIN ||
    DEFAULT_WP_MEDIA_ORIGIN
  ).replace(/\/$/, '');
}

/** Bundled uploads in public/wp-content — static path for Next.js. */
function toStaticWpContentPath(relativePath: string): string {
  const safe = relativePath.replace(/^\/+/, '').replace(/^wp-content\//, '');
  return `/wp-content/${safe}`;
}

function apiMediaToStatic(url: string): string {
  return toStaticWpContentPath(url.replace(/^\/api\/wp-media\//, ''));
}

/**
 * Keep Elementor thumb paths as static /wp-content URLs.
 * Missing files fall through next.config rewrite → /api/wp-media (fs + remote).
 */
function normalizeWpContentRel(rel: string): string {
  return rel.startsWith('wp-content/') ? `/${rel}` : `/wp-content/${rel.replace(/^\/+/, '')}`;
}

/** Local college packs live in public/wp-content/uploads/colleges — keep relative. */
function isBundledCollegeUpload(pathname: string): boolean {
  return /^\/?wp-content\/uploads\/colleges\//i.test(pathname);
}

function isHostingerMediaHost(hostname: string): boolean {
  const host = hostname.replace(/^www\./, '').toLowerCase();
  return host.endsWith('hostingersite.com') || host.endsWith('hostinger.com');
}

/**
 * Colleges stay same-origin (bundled on Amplify). All other WP uploads point at
 * Hostinger so live pages do not 404 when Amplify excludes public/wp-content.
 */
function toDeployableWpContentUrl(pathOrUrl: string): string {
  let pathname = pathOrUrl;

  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith('//')) {
    const absolute = pathOrUrl.startsWith('//')
      ? `https:${pathOrUrl}`
      : pathOrUrl.replace(/^http:\/\//i, 'https://');
    try {
      const u = new URL(absolute);
      const host = u.hostname.replace(/^www\./, '').toLowerCase();
      if (host === 'argroupofeducation.com' && u.pathname.includes('/wp-content/')) {
        pathname = normalizeWpContentRel(u.pathname.replace(/^\/+/, ''));
      } else if (isHostingerMediaHost(u.hostname) && u.pathname.includes('/wp-content/')) {
        return absolute.replace(/^http:\/\//i, 'https://');
      } else {
        return absolute.replace(/^http:\/\//i, 'https://');
      }
    } catch {
      return pathOrUrl;
    }
  }

  if (pathname.startsWith('/wp-content/')) {
    pathname = normalizeWpContentRel(pathname.replace(/^\/+/, ''));
  } else if (isBundledCollegeUpload(pathname)) {
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
  } else {
    return pathOrUrl;
  }

  if (isBundledCollegeUpload(pathname)) {
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
  }

  const rel = pathname.replace(/^\/wp-content\//i, '');
  return `${getWpMediaOrigin()}/wp-content/${rel}`;
}

/** Legacy WP uploads → deployable URL (local colleges or Hostinger CDN). */
export function resolveWpMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();
  if (trimmed.startsWith('/api/wp-media/')) {
    return toDeployableWpContentUrl(apiMediaToStatic(trimmed));
  }
  if (trimmed.startsWith('/wp-content/')) {
    return toDeployableWpContentUrl(trimmed);
  }
  if (trimmed.startsWith('/images/') || trimmed.startsWith('/ar-')) {
    return trimmed;
  }

  const withoutHost = trimmed.replace(WP_MEDIA_HOST, '');
  if (withoutHost !== trimmed) {
    const rel = withoutHost.replace(/^\/+/, '');
    if (rel.startsWith('wp-content/')) {
      return toDeployableWpContentUrl(normalizeWpContentRel(rel));
    }
  }

  // Keep known CDN hosts (Payload / Vercel Blob / Hostinger); drop localhost + other hotlinks.
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const host = new URL(trimmed).hostname.replace(/^www\./, '').toLowerCase();
      if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
        return null;
      }
      if (host === 'argroupofeducation.com') {
        const u = new URL(trimmed.replace(/^http:\/\//i, 'https://'));
        if (u.pathname.includes('/wp-content/')) {
          return toDeployableWpContentUrl(u.pathname);
        }
      }
      if (isHostingerMediaHost(host)) {
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

/**
 * Upgrade Payload/Vercel Blob resized variants to the original file URL.
 * Example: `…-uuid-300x169-sizeHash.webp` → `…-uuid.webp`
 */
export function preferFullSizeVercelBlobUrl(url: string): string {
  return url.replace(/-\d+x\d+-[A-Za-z0-9]+(\.(?:webp|jpe?g|png|gif))$/i, '$1');
}

export function rewriteSingleWpMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('/api/wp-media/')) {
    return toDeployableWpContentUrl(apiMediaToStatic(trimmed));
  }

  const resolved = resolveWpMediaUrl(trimmed);
  if (resolved) return resolved;

  const hostMatch = trimmed.match(
    /^https?:\/\/(?:www\.)?argroupofeducation\.com\/wp-content\/(.+)$/i
  );
  if (hostMatch) {
    return toDeployableWpContentUrl(normalizeWpContentRel(`wp-content/${hostMatch[1]}`));
  }

  if (trimmed.startsWith('/wp-content/')) {
    return toDeployableWpContentUrl(normalizeWpContentRel(trimmed.replace(/^\/+/, '')));
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
