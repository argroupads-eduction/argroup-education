const WP_MEDIA_HOST = /^(?:https?:)?\/\/(?:www\.)?argroupofeducation\.com/i;

/** CDN that still hosts legacy WP uploads when the Next deploy omits public/wp-content. */
function wpMediaCdnOrigin(): string {
  const fromEnv = process.env.WP_MEDIA_ORIGIN?.trim().replace(/\/$/, '');
  if (fromEnv) {
    // Keep apex → www so sitemap-images / OG never emit mixed hosts.
    try {
      const u = new URL(fromEnv);
      if (u.hostname === 'argroupofeducation.com') {
        u.hostname = 'www.argroupofeducation.com';
      }
      return u.origin;
    } catch {
      return fromEnv;
    }
  }
  return 'https://www.argroupofeducation.com';
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
 * Do not rewrite to /api/wp-media here — that used to self-fetch /wp-content and loop.
 */
function normalizeWpContentRel(rel: string): string {
  return rel.startsWith('wp-content/') ? `/${rel}` : `/wp-content/${rel.replace(/^\/+/, '')}`;
}

/** Local college packs live in public/wp-content/uploads/colleges — keep relative. */
function isBundledCollegeUpload(pathname: string): boolean {
  return /^\/?wp-content\/uploads\/colleges\//i.test(pathname);
}

/** Relative legacy WP media → absolute CDN so heroes work when public/wp-content is incomplete. */
function toCdnWpContentUrl(pathname: string): string {
  const rel = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${wpMediaCdnOrigin()}${rel}`;
}

function absolutizeIfNeeded(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith('//')) {
    const absolute = pathOrUrl.startsWith('//')
      ? `https:${pathOrUrl}`
      : pathOrUrl.replace(/^http:\/\//i, 'https://');
    return absolute.replace(
      /^https:\/\/argroupofeducation\.com/i,
      'https://www.argroupofeducation.com'
    );
  }
  if (isBundledCollegeUpload(pathOrUrl)) return pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  if (pathOrUrl.startsWith('/wp-content/')) return toCdnWpContentUrl(pathOrUrl);
  return pathOrUrl;
}

/** Legacy WP uploads → local college packs stay relative; other media uses CDN absolute URLs. */
export function resolveWpMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();
  // Prefer static /wp-content for bundled colleges images (deploy-stable).
  if (trimmed.startsWith('/api/wp-media/')) {
    return absolutizeIfNeeded(apiMediaToStatic(trimmed));
  }
  if (trimmed.startsWith('/wp-content/')) {
    return absolutizeIfNeeded(normalizeWpContentRel(trimmed.replace(/^\/+/, '')));
  }
  if (trimmed.startsWith('/images/') || trimmed.startsWith('/ar-')) {
    return trimmed;
  }

  const withoutHost = trimmed.replace(WP_MEDIA_HOST, '');
  if (withoutHost !== trimmed) {
    const rel = withoutHost.replace(/^\/+/, '');
    if (rel.startsWith('wp-content/')) {
      const path = normalizeWpContentRel(rel);
      // Keep absolute CDN URLs for legacy uploads — relative rewrites 404 when
      // public/wp-content is not fully mirrored into the Next deploy.
      if (isBundledCollegeUpload(path)) return path;
      return absolutizeIfNeeded(trimmed);
    }
  }

  // Keep known CDN hosts (Payload / Vercel Blob); drop other third-party hotlinks.
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const host = new URL(trimmed).hostname.replace(/^www\./, '').toLowerCase();
      if (
        host.endsWith('argroupofeducation.com') ||
        host.endsWith('vercel-storage.com') ||
        host.endsWith('public.blob.vercel-storage.com')
      ) {
        let next = trimmed.replace(/^http:\/\//i, 'https://').replace(
          /^https:\/\/argroupofeducation\.com/i,
          'https://www.argroupofeducation.com'
        );
        // Payload imageSizes append -WIDTHxHEIGHT-hash before ext (e.g. -300x169-abc.webp).
        // Featured cards need the original upload, not the tiny admin thumbnail.
        if (host.endsWith('vercel-storage.com') || host.endsWith('public.blob.vercel-storage.com')) {
          next = preferFullSizeVercelBlobUrl(next);
        }
        return next;
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
    return absolutizeIfNeeded(apiMediaToStatic(trimmed));
  }

  const resolved = resolveWpMediaUrl(trimmed);
  if (resolved && resolved !== trimmed) return resolved;

  const hostMatch = trimmed.match(
    /^https?:\/\/(?:www\.)?argroupofeducation\.com\/wp-content\/(.+)$/i
  );
  if (hostMatch) {
    return absolutizeIfNeeded(normalizeWpContentRel(`wp-content/${hostMatch[1]}`));
  }

  if (trimmed.startsWith('/wp-content/')) {
    return absolutizeIfNeeded(normalizeWpContentRel(trimmed.replace(/^\/+/, '')));
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
