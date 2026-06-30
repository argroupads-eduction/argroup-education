const WP_MEDIA_HOST = /^(?:https?:)?\/\/(?:www\.)?argroupofeducation\.com/i;

/** Bundled uploads in public/wp-content — static path for Next.js. */
function toStaticWpContentPath(relativePath: string): string {
  const safe = relativePath.replace(/^\/+/, '').replace(/^wp-content\//, '');
  return `/wp-content/${safe}`;
}

function apiMediaToStatic(url: string): string {
  return toStaticWpContentPath(url.replace(/^\/api\/wp-media\//, ''));
}

/** Elementor thumb hashes may not be bundled — map to full upload in uploads/. */
function elementorThumbToUpload(rel: string): string | null {
  const m = rel.match(/elementor\/thumbs\/(.+)-[a-z0-9]{20,}(\.[^./]+)$/i);
  if (!m) return null;
  return `/wp-content/uploads/2025/09/${m[1]}${m[2]}`;
}

function normalizeWpContentRel(rel: string): string {
  if (rel.includes('elementor/thumbs/')) {
    return elementorThumbToUpload(rel) ?? `/${rel.startsWith('wp-content/') ? rel : `wp-content/${rel}`}`;
  }
  return rel.startsWith('wp-content/') ? `/${rel}` : `/wp-content/${rel.replace(/^\/+/, '')}`;
}

/** Legacy WP uploads → static /wp-content (public/wp-content on disk). */
export function resolveWpMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();
  if (trimmed.startsWith('/api/wp-media/')) return apiMediaToStatic(trimmed);
  if (trimmed.startsWith('/wp-content/')) {
    return normalizeWpContentRel(trimmed.replace(/^\/+/, ''));
  }

  const withoutHost = trimmed.replace(WP_MEDIA_HOST, '');
  if (withoutHost !== trimmed) {
    const rel = withoutHost.replace(/^\/+/, '');
    if (rel.startsWith('wp-content/')) return normalizeWpContentRel(rel);
  }

  return trimmed;
}

export function rewriteSingleWpMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('/api/wp-media/')) return apiMediaToStatic(trimmed);

  const resolved = resolveWpMediaUrl(trimmed);
  if (resolved && resolved !== trimmed) return resolved;

  const hostMatch = trimmed.match(
    /^https?:\/\/(?:www\.)?argroupofeducation\.com\/wp-content\/(.+)$/i
  );
  if (hostMatch) {
    return normalizeWpContentRel(`wp-content/${hostMatch[1]}`);
  }

  if (trimmed.startsWith('/wp-content/')) {
    return normalizeWpContentRel(trimmed.replace(/^\/+/, ''));
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
