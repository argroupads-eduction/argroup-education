import { buildDynamicSitemap, type SitemapEntry } from '@backend/handlers/siteSearch';
import { BLOG_EXCLUDED_LIST_SLUGS, blogPostPath } from '@/lib/blogUtils';
import { hasUsableDatabase } from '@/lib/databaseEnv';
import { PROGRAM_HUB_WP_SLUG } from '@/lib/programHubContent';
import { getSupplementalSitemapEntries } from '@/lib/seoCrawlConfig';
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
        const lastmod = doc.modified ?? doc.date ?? now;
        entries.push({
          loc: absoluteUrl(baseUrl, `/${slug}`),
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

/** DB-backed blogs + CMS pages (when Neon/Postgres is available). */
async function getDatabaseSitemapEntries(baseUrl: string): Promise<SitemapEntry[]> {
  if (!hasUsableDatabase()) return [];

  try {
    return await buildDynamicSitemap(baseUrl);
  } catch (error) {
    console.warn('[sitemap] Database entries skipped:', error);
    return [];
  }
}

/**
 * Build the full public sitemap from all sources:
 * structured hubs (MBBS/MD-MS), WP bundle, and live CMS/DB content.
 */
export async function buildSitemapEntries(baseUrl: string): Promise<SitemapEntry[]> {
  const supplemental = getSupplementalSitemapEntries(baseUrl);
  const [bundle, database] = await Promise.all([
    getBundleSitemapEntries(baseUrl),
    getDatabaseSitemapEntries(baseUrl),
  ]);

  return mergeSitemapEntries(supplemental, bundle, database);
}
