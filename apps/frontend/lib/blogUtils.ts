import { metaDescriptionFromContent } from '@/lib/wpHtmlPrepare';

/** Newest first — featured slot uses index 0. */
export function sortBlogPostsByNewest<T extends { publishedAt: string }>(posts: T[]): T[] {
  return [...posts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/** Plain-text excerpt for cards (no raw `<p>` tags). */
export function blogCardExcerpt(
  excerpt: string | null | undefined,
  content?: string,
  max = 140
): string {
  const raw = metaDescriptionFromContent(excerpt, content ?? '', max);
  return raw
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatBlogDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function readingTimeMinutes(html: string): number {
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Public URL for a blog post (supports nested WP slugs like `neet/doctor`). */
export function blogPostPath(slug: string): string {
  const parts = slug.split('/').filter(Boolean).map((s) => encodeURIComponent(s));
  return `/blog/${parts.join('/')}`;
}

/** DB / API slug from `[...slug]` route segments. */
export function slugFromBlogRouteSegments(segments: string[]): string {
  return segments.map((s) => decodeURIComponent(s)).join('/');
}
