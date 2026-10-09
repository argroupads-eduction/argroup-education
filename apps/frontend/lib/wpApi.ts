import { plainTextFromHtml } from '@/lib/decodeHtmlEntities';

const WP_BASE = (process.env.WP_API_BASE || 'https://cms.argroupofeducation.com').replace(/\/$/, '');
const REVALIDATE_SECONDS = 60;

type WpTerm = { name?: string; taxonomy?: string };
type WpMedia = { source_url?: string };
type WpPost = {
  id: number;
  slug: string;
  date_gmt?: string;
  modified_gmt?: string;
  title?: { rendered?: string };
  content?: { rendered?: string };
  excerpt?: { rendered?: string };
  meta?: Record<string, string | undefined>;
  _embedded?: {
    'wp:featuredmedia'?: WpMedia[];
    'wp:term'?: WpTerm[][];
  };
};

async function wpFetchWithMeta(
  pathAndQuery: string,
  tags: string[]
): Promise<{ json: unknown; totalPages: number } | null> {
  try {
    const res = await fetch(`${WP_BASE}/wp-json/wp/v2/${pathAndQuery}`, {
      next: { revalidate: REVALIDATE_SECONDS, tags },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1', 10) || 1;
    return { json: await res.json(), totalPages };
  } catch {
    return null;
  }
}

async function wpFetch(pathAndQuery: string, tags: string[]): Promise<unknown | null> {
  const r = await wpFetchWithMeta(pathAndQuery, tags);
  return r ? r.json : null;
}

function toDate(gmt?: string): Date {
  if (!gmt) return new Date();
  const d = new Date(gmt.endsWith('Z') ? gmt : `${gmt}Z`);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function cleanExcerpt(html?: string): string {
  const withoutReadMore = (html || '').replace(/<a[^>]*class="[^"]*read-more[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
  return plainTextFromHtml(withoutReadMore).trim();
}

function terms(post: WpPost, taxonomy: string): string[] {
  const groups = post._embedded?.['wp:term'] ?? [];
  return groups.flat().filter((t) => t?.taxonomy === taxonomy && t.name).map((t) => String(t.name));
}

function parseJson(value?: string): unknown | null {
  if (!value || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function splitKeywords(value?: string): string[] {
  if (!value) return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

function featuredUrl(post: WpPost): string | null {
  return post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null;
}

export function wpPostToDetail(post: WpPost) {
  const meta = post.meta ?? {};
  return {
    id: String(post.id),
    title: plainTextFromHtml(post.title?.rendered || post.slug),
    slug: post.slug,
    content: post.content?.rendered || '',
    excerpt: cleanExcerpt(post.excerpt?.rendered) || plainTextFromHtml(meta.rank_math_description || ''),
    featuredImage: featuredUrl(post),
    category: terms(post, 'category')[0] || 'Blog',
    tags: terms(post, 'post_tag'),
    author: meta.ar_legacy_author?.trim() || 'AR Group of Education',
    metaTitle: meta.rank_math_title?.trim() || null,
    metaDescription: meta.rank_math_description?.trim() || null,
    canonicalUrl: meta.rank_math_canonical_url?.trim() || null,
    keywords: splitKeywords(meta.ar_keywords),
    schemaJson: parseJson(meta.ar_schema_json),
    publishedAt: toDate(post.date_gmt),
    createdAt: toDate(post.date_gmt),
    updatedAt: toDate(post.modified_gmt || post.date_gmt),
    published: true,
  };
}

export function wpPostToListItem(post: WpPost) {
  const d = wpPostToDetail(post);
  return {
    id: d.id,
    title: d.title,
    slug: d.slug,
    excerpt: d.excerpt,
    featuredImage: d.featuredImage,
    category: d.category,
    publishedAt: d.publishedAt.toISOString(),
  };
}

const EMBED = '_embed=wp:featuredmedia,wp:term';

export async function getWpPostBySlug(slug: string) {
  const json = await wpFetch(
    `posts?slug=${encodeURIComponent(slug)}&status=publish&${EMBED}`,
    ['blog-posts', 'blog-post']
  );
  if (!Array.isArray(json) || json.length === 0) return null;
  return wpPostToDetail(json[0] as WpPost);
}

export async function getWpLatestPosts(limit = 8) {
  const json = await wpFetch(
    `posts?per_page=${Math.min(50, Math.max(1, limit))}&orderby=date&order=desc&status=publish&${EMBED}`,
    ['blog-posts', 'blog-sidebar']
  );
  if (!Array.isArray(json)) return null;
  return (json as WpPost[]).map(wpPostToListItem);
}

/**
 * All published posts (newest first), light fields only (no content).
 * Used by the /blog index: filtering, dedupe and pagination happen in the page.
 * Returns null if WordPress fails on any batch (so callers never cache a half list).
 */
export async function getWpBlogCatalog(max = 500) {
  const perPage = 100;
  const fields = 'id,slug,date_gmt,modified_gmt,title,excerpt,meta,_links,_embedded';
  const tags = ['blog-posts', 'blog-list'];
  const url = (p: number) =>
    `posts?per_page=${perPage}&page=${p}&orderby=date&order=desc&status=publish&_fields=${fields}&${EMBED}`;

  const first = await wpFetchWithMeta(url(1), tags);
  if (!first || !Array.isArray(first.json)) return null;

  const lastPage = Math.min(first.totalPages, Math.ceil(max / perPage));
  const restPages: number[] = [];
  for (let p = 2; p <= lastPage; p++) restPages.push(p);

  const rest = await Promise.all(restPages.map((p) => wpFetchWithMeta(url(p), tags)));
  if (rest.some((r) => !r || !Array.isArray(r.json))) return null;

  const all = [first.json as WpPost[], ...rest.map((r) => (r as { json: unknown }).json as WpPost[])].flat();
  return all.slice(0, max).map(wpPostToListItem);
}

