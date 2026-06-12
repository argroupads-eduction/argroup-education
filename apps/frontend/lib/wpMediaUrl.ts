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

/** Rewrite legacy WP absolute URLs inside prepared HTML. */
export function rewriteWpMediaUrlsInHtml(html: string): string {
  if (!html || !/argroupofeducation\.com\/wp-content\//i.test(html)) return html;

  return html.replace(
    /(\b(?:src|href)=["'])(https?:\/\/(?:www\.)?argroupofeducation\.com\/wp-content\/([^"']+))(["'])/gi,
    (_match, before: string, _full: string, path: string, after: string) => {
      return `${before}/wp-content/${path}${after}`;
    }
  );
}
