import type { BlogListItem } from '@/lib/contentApi';
import { metaDescriptionFromContent } from '@/lib/wpHtmlPrepare';

/** Legacy duplicate slugs hidden from blog index (canonical slug kept). */
export const BLOG_EXCLUDED_LIST_SLUGS = new Set([
  'neet-re-exam-2026-vs-original-exam',
]);

/** Short / legacy blog slugs → canonical published slug. */
export const BLOG_SLUG_CANONICAL: Record<string, string> = {
  'neet-re-exam-2026-vs-original-exam':
    'neet-re-exam-2026-vs-original-exam-which-is-tougher',
};

function normalizeBlogTitleKey(title: string): string {
  return title
    .replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '')
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function pickBetterBlogPost(a: BlogListItem, b: BlogListItem): BlogListItem {
  if (a.featuredImage && !b.featuredImage) return a;
  if (b.featuredImage && !a.featuredImage) return b;
  if (a.slug.length !== b.slug.length) return a.slug.length > b.slug.length ? a : b;
  return new Date(b.publishedAt).getTime() >= new Date(a.publishedAt).getTime() ? b : a;
}

/** Drop known duplicate slugs and collapse same-title CMS re-imports. */
export function dedupeBlogPosts(posts: BlogListItem[]): BlogListItem[] {
  const withoutExcluded = posts.filter((p) => !BLOG_EXCLUDED_LIST_SLUGS.has(p.slug));
  const byTitle = new Map<string, BlogListItem>();

  for (const post of withoutExcluded) {
    const key = normalizeBlogTitleKey(post.title);
    const prev = byTitle.get(key);
    byTitle.set(key, prev ? pickBetterBlogPost(prev, post) : post);
  }

  return [...byTitle.values()];
}

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
