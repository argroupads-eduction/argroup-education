/**
 * Import apps/frontend/data/wp-export-bundle → Payload CMS (posts + pages).
 *
 * Preserves full WP HTML in `htmlContent` so the marketing frontend layout stays identical.
 *
 * Prereqs:
 *   - Payload running OR DATABASE_URL set (uses Local API)
 *   - PAYLOAD_DATABASE_PUSH=true once after adding htmlContent fields, OR run payload migrate
 *   - Bundle: npm run build:wp-bundle  (or data/wp-export from wp:export)
 *
 * Usage (from ar-group-of-eductions):
 *   npx tsx scripts/import-wp-bundle.mts
 *   npx tsx scripts/import-wp-bundle.mts --dry-run --limit=5
 *   npx tsx scripts/import-wp-bundle.mts --posts-only
 *   npx tsx scripts/import-wp-bundle.mts --pages-only --limit=20
 */

import 'dotenv/config';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPayload } from 'payload';
import config from '@payload-config';
import { minimalLexicalParagraph } from './wp-import/minimalLexical.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const BUNDLE_DIR = path.join(REPO_ROOT, 'apps/frontend/data/wp-export-bundle');
const HOME_SLUG = 'mbbs-admission-in-top-colleges';

type WpItem = {
  wpId: number;
  type: 'page' | 'post';
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  status: string;
  date: string;
  modified?: string;
  featuredImage: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  ogImage?: string | null;
  keywords?: string[];
  focusKeyword?: string | null;
};

function seoFieldsFromItem(item: WpItem) {
  const keywords = Array.isArray(item.keywords)
    ? item.keywords.map((k) => String(k).trim()).filter(Boolean)
    : [];
  const focusKeyword =
    (typeof item.focusKeyword === 'string' && item.focusKeyword.trim()) ||
    keywords[0] ||
    null;

  return {
    canonicalUrl: item.canonicalUrl ?? null,
    focusKeyword,
    seoKeywords:
      keywords.length > 1 ? keywords.slice(1).join(', ') : keywords[0] ? '' : '',
    ogImageUrl: item.ogImage ?? item.featuredImage ?? null,
    schemaJson: null as Record<string, unknown> | null,
  };
}

type Report = {
  startedAt: string;
  dryRun: boolean;
  posts: { created: number; updated: number; skipped: number; errors: string[] };
  pages: { created: number; updated: number; skipped: number; errors: string[] };
};

function parseArgs(argv: string[]) {
  const dryRun = argv.includes('--dry-run');
  const postsOnly = argv.includes('--posts-only');
  const pagesOnly = argv.includes('--pages-only');
  const skipExisting = argv.includes('--skip-existing');
  const limitMatch = argv.find((a) => a.startsWith('--limit='));
  const offsetMatch = argv.find((a) => a.startsWith('--offset='));
  const limit = limitMatch ? Math.max(1, parseInt(limitMatch.split('=')[1] ?? '0', 10)) : Infinity;
  const offset = offsetMatch ? Math.max(0, parseInt(offsetMatch.split('=')[1] ?? '0', 10)) : 0;
  return {
    dryRun,
    importPosts: !pagesOnly,
    importPages: !postsOnly,
    skipExisting,
    limit,
    offset,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isConnectionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('Connection terminated') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('connect to Postgres')
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function plainExcerpt(item: WpItem): string {
  const fromExcerpt = stripHtml(item.excerpt);
  if (fromExcerpt) return fromExcerpt.slice(0, 500);
  return stripHtml(item.content).slice(0, 500);
}

/** Import uses placeholder Lexical — full layout lives in htmlContent (see WP-PAYLOAD-MIGRATION.md). */
function importLexicalPlaceholder(item: WpItem) {
  return minimalLexicalParagraph(plainExcerpt(item) || stripHtml(item.title) || item.slug);
}

function pageLayoutBlock(excerpt: string) {
  return [
    {
      blockType: 'content' as const,
      columns: [
        {
          size: 'full' as const,
          richText: minimalLexicalParagraph(excerpt),
        },
      ],
    },
  ];
}

async function loadBundle(): Promise<{ posts: WpItem[]; pages: WpItem[] }> {
  const postsPath = path.join(BUNDLE_DIR, 'posts.json');
  const pagesPath = path.join(BUNDLE_DIR, 'pages.json');
  const posts = JSON.parse(await readFile(postsPath, 'utf8')) as WpItem[];
  const pages = JSON.parse(await readFile(pagesPath, 'utf8')) as WpItem[];
  return { posts, pages };
}

async function upsertPost(
  payload: Awaited<ReturnType<typeof getPayload>>,
  item: WpItem,
  opts: { dryRun: boolean; skipExisting: boolean }
): Promise<'created' | 'updated' | 'skipped'> {
  if (item.status !== 'publish') return 'skipped';

  const excerpt = plainExcerpt(item);
  const content = importLexicalPlaceholder(item);
  const data = {
    title: stripHtml(item.title),
    slug: item.slug,
    htmlContent: item.content,
    featuredImageUrl: item.featuredImage,
    content,
    meta: {
      title: item.metaTitle || stripHtml(item.title),
      description: item.metaDescription || excerpt.slice(0, 160),
    },
    ...seoFieldsFromItem(item),
    publishedAt: item.date,
    _status: 'published' as const,
  };

  if (opts.dryRun) return 'created';

  const existing = await payload.find({
    collection: 'posts',
    where: { slug: { equals: item.slug } },
    limit: 1,
    pagination: false,
    depth: 0,
    select: { id: true, slug: true },
  });

  const doc = existing.docs[0];
  if (doc && opts.skipExisting) return 'skipped';

  const importContext = {
    disableBackendSync: true,
    disableRevalidate: true,
    disablePublishedAtDefault: true,
  };

  if (doc) {
    await payload.update({
      collection: 'posts',
      id: doc.id,
      data,
      overrideAccess: true,
      context: importContext,
    });
    return 'updated';
  }

  await payload.create({
    collection: 'posts',
    data,
    overrideAccess: true,
    context: importContext,
  });
  return 'created';
}

async function upsertPage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  item: WpItem,
  opts: { dryRun: boolean; skipExisting: boolean }
): Promise<'created' | 'updated' | 'skipped'> {
  if (item.status !== 'publish') return 'skipped';
  if (item.slug === HOME_SLUG) return 'skipped';

  const excerpt = plainExcerpt(item);
  const content = importLexicalPlaceholder(item);
  const data = {
    title: stripHtml(item.title),
    slug: item.slug,
    htmlContent: item.content,
    featuredImageUrl: item.featuredImage,
    content,
    hero: { type: 'none' as const },
    layout: pageLayoutBlock(excerpt),
    meta: {
      title: item.metaTitle || stripHtml(item.title),
      description: item.metaDescription || excerpt.slice(0, 160),
    },
    ...seoFieldsFromItem(item),
    publishedAt: item.date,
    _status: 'published' as const,
  };

  if (opts.dryRun) return 'created';

  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: item.slug } },
    limit: 1,
    pagination: false,
    depth: 0,
    select: { id: true, slug: true },
  });

  const doc = existing.docs[0];
  if (doc && opts.skipExisting) return 'skipped';

  const importContext = {
    disableBackendSync: true,
    disableRevalidate: true,
    disablePublishedAtDefault: true,
  };

  if (doc) {
    await payload.update({
      collection: 'pages',
      id: doc.id,
      data,
      overrideAccess: true,
      context: importContext,
    });
    return 'updated';
  }

  await payload.create({
    collection: 'pages',
    data,
    overrideAccess: true,
    context: importContext,
  });
  return 'created';
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const report: Report = {
    startedAt: new Date().toISOString(),
    dryRun: args.dryRun,
    posts: { created: 0, updated: 0, skipped: 0, errors: [] },
    pages: { created: 0, updated: 0, skipped: 0, errors: [] },
  };

  console.log('[wp→payload] Loading bundle from', BUNDLE_DIR);
  const { posts, pages } = await loadBundle();
  console.log(`[wp→payload] Found ${posts.length} posts, ${pages.length} pages`);

  process.env.PAYLOAD_DATABASE_PUSH = 'false';

  let payload = await getPayload({ config });

  const refreshPayload = async () => {
    await sleep(1500);
    payload = await getPayload({ config });
  };

  if (args.importPosts) {
    const slice = posts.slice(args.offset, args.offset + args.limit);
    console.log(`[wp→payload] Importing ${slice.length} posts (offset ${args.offset})…`);
    for (const item of slice) {
      try {
        const r = await upsertPost(payload, item, args);
        report.posts[r === 'created' ? 'created' : r === 'updated' ? 'updated' : 'skipped'] += 1;
        if ((report.posts.created + report.posts.updated) % 25 === 0) {
          console.log(`  posts: ${report.posts.created} created, ${report.posts.updated} updated`);
        }
        await sleep(150);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        report.posts.errors.push(`${item.slug}: ${msg}`);
        if (isConnectionError(e)) {
          console.warn('[wp→payload] DB connection lost — reconnecting…');
          try {
            await refreshPayload();
            const r = await upsertPost(payload, item, args);
            report.posts[r === 'created' ? 'created' : r === 'updated' ? 'updated' : 'skipped'] += 1;
          } catch (retryErr) {
            const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
            report.posts.errors.push(`${item.slug} (retry): ${retryMsg}`);
          }
        }
      }
    }
  }

  if (args.importPages) {
    const slice = pages.slice(args.offset, args.offset + args.limit);
    console.log(`[wp→payload] Importing ${slice.length} pages (offset ${args.offset})…`);
    for (const item of slice) {
      try {
        const r = await upsertPage(payload, item, args);
        report.pages[r === 'created' ? 'created' : r === 'updated' ? 'updated' : 'skipped'] += 1;
        if ((report.pages.created + report.pages.updated) % 50 === 0) {
          console.log(`  pages: ${report.pages.created} created, ${report.pages.updated} updated`);
        }
        await sleep(150);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        report.pages.errors.push(`${item.slug}: ${msg}`);
        if (isConnectionError(e)) {
          console.warn('[wp→payload] DB connection lost — reconnecting…');
          try {
            await refreshPayload();
            const r = await upsertPage(payload, item, args);
            report.pages[r === 'created' ? 'created' : r === 'updated' ? 'updated' : 'skipped'] += 1;
          } catch (retryErr) {
            const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
            report.pages.errors.push(`${item.slug} (retry): ${retryMsg}`);
          }
        }
      }
    }
  }

  const reportDir = path.join(BUNDLE_DIR, 'reports');
  await mkdir(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `payload-import-${Date.now()}.json`);
  await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n[wp→payload] Done', args.dryRun ? '(dry run)' : '');
  console.log('  Posts:', report.posts);
  console.log('  Pages:', report.pages);
  console.log('  Report:', reportPath);

  if (report.posts.errors.length || report.pages.errors.length) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error('[wp→payload] Fatal:', e);
  process.exit(1);
});
