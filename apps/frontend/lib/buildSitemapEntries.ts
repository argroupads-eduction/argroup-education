import { buildDynamicSitemap, type SitemapEntry } from '@backend/handlers/siteSearch';
import { BLOG_EXCLUDED_LIST_SLUGS, BLOG_SLUG_CANONICAL, blogPostPath } from '@/lib/blogUtils';
import { hasUsableDatabase } from '@/lib/databaseEnv';
import {
  getPayloadCmsServerFetchUrl,
  isPayloadCmsConfigured,
} from '@/lib/payloadCmsUrl';
import { readPayloadCms } from '@/lib/payloadCmsRead';
import { PROGRAM_HUB_WP_SLUG } from '@/lib/programHubContent';
import { resolveInternalPath } from '@/lib/rewriteInternalLinks';
import { getSupplementalSitemapEntries } from '@/lib/seoCrawlConfig';
import { withServerTimeout } from '@/lib/serverTimeout';
import { getAllWpExportBlogPosts } from '@/lib/wpExportContent';

export type { SitemapEntry };

const HOME_WP_SLUG = 'mbbs-admission-in-top-colleges';

/** Slugs served by dedicated Next routes — exclude duplicate root-level URLs. */
const MODERN_HUB_SLUGS = new Set(['mbbs-abroad', 'mbbs-india', 'md-ms']);

/** Legacy WP hub slugs that 308 to canonical program routes. */
const LEGACY_HUB_SLUGS = new Set([
  PROGRAM_HUB_WP_SLUG.abroad,
  PROGRAM_HUB_WP_SLUG.india,
  PROGRAM_HUB_WP_SLUG.mdms,
  'mbbs-in-abroad',
  'mbbs-in-india',
]);

const SITEMAP_EXCLUDED_SLUGS = new Set([
  HOME_WP_SLUG,
  ...MODERN_HUB_SLUGS,
  ...LEGACY_HUB_SLUGS,
]);

type PayloadListDoc = {
  slug?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  _status?: string | null;
};

function mergeSitemapEntries(...groups: SitemapEntry[][]): SitemapEntry[] {
  const seen = new Set<string>();
  const merged: SitemapEntry[] = [];
  for (const group of groups) {
    for (const entry of group) {
      if (seen.has(entry.loc)) continue;
      seen.add(entry.loc);
      merged.push(entry);
    }
  }
  return merged;
}

function absoluteUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, '');
  if (path === '/') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function isPublishedPayloadDoc(doc: PayloadListDoc): boolean {
  return Boolean(doc.slug?.trim()) && (doc._status === 'published' || !doc._status);
}

async function fetchAllPayloadCollectionDocs(
  collection: 'pages' | 'posts'
): Promise<PayloadListDoc[]> {
  if (!isPayloadCmsConfigured()) return [];
  const base = getPayloadCmsServerFetchUrl();
  if (!base) return [];

  const docs: PayloadListDoc[] = [];
  let page = 1;
  const limit = 100;

  while (page <= 50) {
    const qs = new URLSearchParams({
      limit: String(limit),
      page: String(page),
      depth: '0',
      sort: '-updatedAt',
    });
    const result = await withServerTimeout(
      readPayloadCms(`${base}/api/${collection}?${qs.toString()}`),
      8000,
      null
    );
    if (!result?.responseOk || !result.json || typeof result.json !== 'object') break;

    const body = result.json as {
      docs?: PayloadListDoc[];
      hasNextPage?: boolean;
      totalPages?: number;
    };
    const batch = (body.docs ?? []).filter(isPublishedPayloadDoc);
    docs.push(...batch);

    if (!body.hasNextPage && page >= (body.totalPages ?? page)) break;
    if (!batch.length && !(body.docs?.length)) break;
    page += 1;
  }

  return docs;
}

/** Live Payload CMS pages + posts — keeps sitemap in sync when editors publish in CMS. */
async function getPayloadCmsSitemapEntries(baseUrl: string): Promise<SitemapEntry[]> {
  if (!isPayloadCmsConfigured()) return [];

  try {
    const now = new Date().toISOString();
    const [pages, posts] = await Promise.all([
      fetchAllPayloadCollectionDocs('pages'),
      fetchAllPayloadCollectionDocs('posts'),
    ]);

    const entries: SitemapEntry[] = [];

    for (const doc of pages) {
      const slug = doc.slug?.trim();
      if (!slug || SITEMAP_EXCLUDED_SLUGS.has(slug)) continue;
      const lastmod = doc.updatedAt ?? doc.publishedAt ?? doc.createdAt ?? now;
      const path = resolveInternalPath(slug);
      if (path === '/' || SITEMAP_EXCLUDED_SLUGS.has(path.replace(/^\/+/, '').split('/')[0] ?? '')) {
        continue;
      }
      entries.push({
        loc: absoluteUrl(baseUrl, path),
        lastmod: new Date(lastmod).toISOString(),
        changefreq: 'weekly',
        priority: 0.65,
      });
    }

    for (const doc of posts) {
      const slug = doc.slug?.trim();
      if (!slug || BLOG_EXCLUDED_LIST_SLUGS.has(slug) || slug in BLOG_SLUG_CANONICAL) continue;
      const lastmod = doc.updatedAt ?? doc.publishedAt ?? doc.createdAt ?? now;
      entries.push({
        loc: absoluteUrl(baseUrl, blogPostPath(slug)),
        lastmod: new Date(lastmod).toISOString(),
        changefreq: 'weekly',
        priority: 0.7,
      });
    }

    return entries;
  } catch (error) {
    console.warn('[sitemap] Payload CMS entries skipped:', error);
    return [];
  }
}

/** WP export bundle — pages (root slug) + blog posts (/blog/...). */
async function getBundleSitemapEntries(baseUrl: string): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];
  const now = new Date().toISOString();

  try {
    const { readFile } = await import('node:fs/promises');
    const path = await import('node:path');

    const dirs = [
      path.resolve(process.cwd(), 'data/wp-export-bundle'),
      path.resolve(process.cwd(), '../../data/wp-export'),
    ];

    let pagesRaw: string | null = null;
    for (const dir of dirs) {
      try {
        pagesRaw = await readFile(path.join(dir, 'pages.json'), 'utf8');
        break;
      } catch {
        /* try next */
      }
    }

    if (pagesRaw) {
      const pages = JSON.parse(pagesRaw) as { slug?: string; modified?: string; date?: string }[];
      for (const doc of pages) {
        const slug = doc.slug?.trim();
        if (!slug || SITEMAP_EXCLUDED_SLUGS.has(slug)) continue;
        const path = resolveInternalPath(slug);
        const firstSeg = path.replace(/^\/+/, '').split('/')[0] ?? '';
        if (path === '/' || SITEMAP_EXCLUDED_SLUGS.has(firstSeg)) continue;
        const lastmod = doc.modified ?? doc.date ?? now;
        entries.push({
          loc: absoluteUrl(baseUrl, path),
          lastmod: new Date(lastmod).toISOString(),
          changefreq: 'monthly',
          priority: 0.65,
        });
      }
    }

    for (const post of await getAllWpExportBlogPosts()) {
      if (BLOG_EXCLUDED_LIST_SLUGS.has(post.slug)) continue;
      entries.push({
        loc: absoluteUrl(baseUrl, blogPostPath(post.slug)),
        lastmod: new Date(post.publishedAt ?? now).toISOString(),
        changefreq: 'weekly',
        priority: 0.7,
      });
    }
  } catch (error) {
    console.warn('[sitemap] WP bundle entries skipped:', error);
  }

  return entries;
}

function filterSitemapEntries(entries: SitemapEntry[], baseUrl: string): SitemapEntry[] {
  const base = baseUrl.replace(/\/$/, '');
  const blogPrefix = `${base}/blog/`;

  return entries.filter((entry) => {
    if (entry.loc.startsWith(blogPrefix)) {
      const slug = decodeURIComponent(entry.loc.slice(blogPrefix.length));
      if (BLOG_EXCLUDED_LIST_SLUGS.has(slug)) return false;
      if (slug in BLOG_SLUG_CANONICAL) return false;
      return true;
    }

    if (entry.loc.startsWith(`${base}/`) && entry.loc !== `${base}/`) {
      const slug = decodeURIComponent(entry.loc.slice(base.length + 1).split('/')[0] ?? '');
      if (SITEMAP_EXCLUDED_SLUGS.has(slug)) return false;
    }

    return true;
  });
}

/** DB-backed blogs + CMS pages (when Neon/Postgres is available). */
async function getDatabaseSitemapEntries(baseUrl: string): Promise<SitemapEntry[]> {
  if (!hasUsableDatabase()) return [];

  try {
    const entries = await buildDynamicSitemap(baseUrl);
    return filterSitemapEntries(entries, baseUrl);
  } catch (error) {
    console.warn('[sitemap] Database entries skipped:', error);
    return [];
  }
}

/**
 * Build the full public sitemap from all sources:
 * structured hubs (MBBS/MD-MS), WP bundle, live Payload CMS, and Neon/DB content.
 * Any newly published page, college page, or blog is picked up automatically.
 */
export async function buildSitemapEntries(baseUrl: string): Promise<SitemapEntry[]> {
  const supplemental = getSupplementalSitemapEntries(baseUrl);
  const [bundle, payload, database] = await Promise.all([
    getBundleSitemapEntries(baseUrl),
    getPayloadCmsSitemapEntries(baseUrl),
    getDatabaseSitemapEntries(baseUrl),
  ]);

  return mergeSitemapEntries(supplemental, bundle, payload, database);
}
