import { plainTextFromHtml } from '@/lib/decodeHtmlEntities';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type ContentType = 'post' | 'page';

export interface SiteContent {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface BlogListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  category: string;
  publishedAt: string;
}

function normalizeContent(doc: SiteContent): SiteContent {
  return {
    ...doc,
    title: plainTextFromHtml(doc.title),
    excerpt: plainTextFromHtml(doc.excerpt),
    metaTitle: doc.metaTitle ? plainTextFromHtml(doc.metaTitle) : null,
    metaDescription: doc.metaDescription ? plainTextFromHtml(doc.metaDescription) : null,
  };
}

function normalizeBlogItem(doc: BlogListItem): BlogListItem {
  return {
    ...doc,
    title: plainTextFromHtml(doc.title),
    excerpt: plainTextFromHtml(doc.excerpt),
  };
}

function apiBase() {
  return API_URL.replace(/\/$/, '');
}

export async function getContentBySlug(slug: string): Promise<SiteContent | null> {
  // 1) Backend API (Neon DB — production + dev:stack)
  try {
    const res = await fetch(`${apiBase()}/api/content/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data) return normalizeContent(json.data as SiteContent);
    }
  } catch {
    /* API offline — fall through to local export */
  }

  // 2) Bundled wp-export JSON (Vercel) or repo data/wp-export (local dev)
  const { getWpExportContentBySlug } = await import('@/lib/wpExportContent');
  const local = await getWpExportContentBySlug(slug);
  return local ? normalizeContent(local) : null;
}

export async function getBlogPosts(page = 1, limit = 12): Promise<{
  data: BlogListItem[];
  total: number;
  pages: number;
}> {
  try {
    const res = await fetch(
      `${apiBase()}/api/blogs?page=${page}&limit=${limit}`,
      { next: { revalidate: 600 }, signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const json = await res.json();
      const data = (json.data ?? []).map((item: BlogListItem) => normalizeBlogItem(item));
      return {
        data,
        total: json.total ?? 0,
        pages: json.pages ?? 0,
      };
    }
  } catch {
    /* fall through */
  }

  try {
    const { getWpExportBlogPosts } = await import('@/lib/wpExportContent');
    return getWpExportBlogPosts(page, limit);
  } catch {
    return { data: [], total: 0, pages: 0 };
  }
}
