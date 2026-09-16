import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { BlogListItem, SiteContent } from '@/lib/contentApi';
import { plainTextFromHtml } from '@/lib/decodeHtmlEntities';
import { extractFirstContentImage } from '@/lib/wpHtmlPrepare';

type WpExportDoc = {
  wpId?: number;
  type?: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  focusKeyword?: string | null;
  keywords?: string[];
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  schemaJson?: unknown | null;
  date?: string;
  modified?: string;
};

let cache: Map<string, SiteContent> | null = null;
let loadPromise: Promise<Map<string, SiteContent>> | null = null;

/** Production bundle (committed) then local full export (gitignored). */
function wpExportDirs(): string[] {
  return [
    path.resolve(process.cwd(), 'data/wp-export-bundle'),
    path.resolve(process.cwd(), '../../data/wp-export'),
  ];
}

async function resolveWpExportDir(): Promise<string | null> {
  for (const dir of wpExportDirs()) {
    try {
      await readFile(path.join(dir, 'pages.json'));
      return dir;
    } catch {
      /* try next */
    }
  }
  return null;
}

function normalizeText(value: string | null | undefined): string {
  if (!value) return '';
  return plainTextFromHtml(value);
}

function toSiteContent(doc: WpExportDoc, type: 'page' | 'post'): SiteContent {
  return {
    id: String(doc.wpId ?? doc.slug),
    type,
    title: normalizeText(doc.title),
    slug: doc.slug,
    content: doc.content,
    excerpt: normalizeText(doc.excerpt),
    featuredImage: doc.featuredImage ?? null,
    metaTitle: doc.metaTitle ? normalizeText(doc.metaTitle) : null,
    metaDescription: doc.metaDescription ? normalizeText(doc.metaDescription) : null,
    canonicalUrl: doc.canonicalUrl ?? null,
    focusKeyword: doc.focusKeyword ?? null,
    keywords: doc.keywords ?? [],
    ogTitle: doc.ogTitle ? normalizeText(doc.ogTitle) : null,
    ogDescription: doc.ogDescription ? normalizeText(doc.ogDescription) : null,
    ogImage: doc.ogImage ?? doc.featuredImage ?? null,
    twitterTitle: doc.twitterTitle ? normalizeText(doc.twitterTitle) : null,
    twitterDescription: doc.twitterDescription
      ? normalizeText(doc.twitterDescription)
      : null,
    schemaJson: doc.schemaJson ?? null,
    publishedAt: doc.date ?? doc.modified ?? null,
    updatedAt: doc.modified ?? doc.date ?? new Date().toISOString(),
  };
}

async function loadExportIndex(): Promise<Map<string, SiteContent>> {
  if (cache) return cache;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const dir = await resolveWpExportDir();
    if (!dir) {
      cache = new Map();
      return cache;
    }
    const [pagesRaw, postsRaw] = await Promise.all([
      readFile(path.join(dir, 'pages.json'), 'utf8').catch(() => '[]'),
      readFile(path.join(dir, 'posts.json'), 'utf8').catch(() => '[]'),
    ]);

    const pages = JSON.parse(pagesRaw) as WpExportDoc[];
    const posts = JSON.parse(postsRaw) as WpExportDoc[];
    const index = new Map<string, SiteContent>();

    for (const doc of pages) {
      if (doc.slug) index.set(doc.slug, toSiteContent(doc, 'page'));
    }
    // Posts override pages on slug collision (matches backend import priority)
    for (const doc of posts) {
      if (doc.slug) index.set(doc.slug, toSiteContent(doc, 'post'));
    }

    cache = index;
    return index;
  })();

  return loadPromise;
}

/** Local WordPress export fallback when backend API is offline (dev). */
export async function getWpExportContentBySlug(slug: string): Promise<SiteContent | null> {
  try {
    const index = await loadExportIndex();
    return index.get(slug) ?? null;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[wpExportContent] fallback unavailable:', err);
    }
    return null;
  }
}

/** Page-only lookup (ignores blog posts that reused the same WP slug). */
export async function getWpExportPageBySlug(slug: string): Promise<SiteContent | null> {
  try {
    const dir = await resolveWpExportDir();
    if (!dir) return null;
    const pagesRaw = await readFile(path.join(dir, 'pages.json'), 'utf8').catch(() => '[]');
    const pages = JSON.parse(pagesRaw) as WpExportDoc[];
    const doc = pages.find((p) => p.slug === slug);
    return doc ? toSiteContent(doc, 'page') : null;
  } catch {
    return null;
  }
}

function wpExportPostsToBlogList(posts: WpExportDoc[]): BlogListItem[] {
  return [...posts]
    .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
    .map((doc) => ({
      id: String(doc.wpId ?? doc.slug),
      title: normalizeText(doc.title),
      slug: doc.slug,
      excerpt: normalizeText(doc.excerpt),
      featuredImage: doc.featuredImage ?? extractFirstContentImage(doc.content) ?? null,
      category: 'Blog',
      publishedAt: doc.date ?? doc.modified ?? new Date().toISOString(),
    }));
}

export async function getAllWpExportBlogPosts(): Promise<BlogListItem[]> {
  try {
    const dir = await resolveWpExportDir();
    if (!dir) return [];
    const raw = await readFile(path.join(dir, 'posts.json'), 'utf8');
    const posts = JSON.parse(raw) as WpExportDoc[];
    return wpExportPostsToBlogList(posts);
  } catch {
    return [];
  }
}

export async function getWpExportBlogPosts(
  page = 1,
  limit = 12
): Promise<{ data: BlogListItem[]; total: number; pages: number }> {
  try {
    const all = await getAllWpExportBlogPosts();
    const total = all.length;
    const pages = Math.ceil(total / limit) || 0;
    const data = all.slice((page - 1) * limit, page * limit);
    return { data, total, pages };
  } catch {
    return { data: [], total: 0, pages: 0 };
  }
}
