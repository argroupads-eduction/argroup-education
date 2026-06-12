const WP_MEDIA_HOST = /^(?:https?:)?\/\/(?:www\.)?argroupofeducation\.com/i;

function wpContentToMediaApi(relativePath: string): string {
  const safe = relativePath.replace(/^\/+/, '').replace(/^wp-content\//, '');
  return `/api/wp-media/${safe}`;
}

/** Legacy WP uploads → /api/wp-media (local public/wp-content first, then WP_MEDIA_ORIGIN). */
export function resolveWpMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();
  if (trimmed.startsWith('/api/wp-media/')) return trimmed;
  // Bundled college banners live in public/ — serve as static assets on Vercel/CDN.
  if (trimmed.startsWith('/wp-content/uploads/colleges/')) return trimmed;
  if (trimmed.startsWith('/wp-content/')) return wpContentToMediaApi(trimmed);

  const withoutHost = trimmed.replace(WP_MEDIA_HOST, '');
  if (withoutHost !== trimmed) {
    const rel = withoutHost.replace(/^\/+/, '');
    if (rel.startsWith('wp-content/')) return wpContentToMediaApi(rel);
  }

  return trimmed;
}

export function rewriteSingleWpMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('/api/wp-media/')) return trimmed;

  const resolved = resolveWpMediaUrl(trimmed);
  if (resolved && resolved !== trimmed) return resolved;

  const hostMatch = trimmed.match(
    /^https?:\/\/(?:www\.)?argroupofeducation\.com\/wp-content\/(.+)$/i
  );
  if (hostMatch) {
    const rel = hostMatch[1];
    if (rel.startsWith('uploads/colleges/')) return `/wp-content/${rel}`;
    return `/api/wp-media/${rel}`;
  }

  if (trimmed.startsWith('/wp-content/')) {
    const rel = trimmed.replace(/^\/wp-content\//, '');
    if (rel.startsWith('uploads/colleges/')) return trimmed;
    return `/api/wp-media/${rel}`;
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
