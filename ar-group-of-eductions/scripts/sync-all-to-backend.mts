/**
 * Backfill all published Payload posts/pages → marketing backend (Neon neondb).
 *
 * Prereqs:
 *   - Backend running with PAYLOAD_SYNC_SECRET set
 *   - ar-group-of-eductions/.env: BACKEND_API_URL, PAYLOAD_SYNC_SECRET (same as backend)
 *
 * Usage:
 *   npx tsx scripts/sync-all-to-backend.mts
 *   npx tsx scripts/sync-all-to-backend.mts --posts-only
 *   npx tsx scripts/sync-all-to-backend.mts --limit=10
 */

import 'dotenv/config';
import { getPayload } from 'payload';
import config from '@payload-config';
import { htmlFromPayloadDoc, syncToMarketingBackend } from '../src/utilities/syncToMarketingBackend';

function parseArgs(argv: string[]) {
  return {
    postsOnly: argv.includes('--posts-only'),
    pagesOnly: argv.includes('--pages-only'),
    limit: (() => {
      const m = argv.find((a) => a.startsWith('--limit='));
      return m ? parseInt(m.split('=')[1] ?? '', 10) : 0;
    })(),
  };
}

async function main() {
  const base = process.env.BACKEND_API_URL?.replace(/\/$/, '');
  const secret = process.env.PAYLOAD_SYNC_SECRET?.trim();
  if (!base || !secret) {
    console.error('Set BACKEND_API_URL and PAYLOAD_SYNC_SECRET in ar-group-of-eductions/.env');
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  const payload = await getPayload({ config });

  let synced = 0;
  let failed = 0;

  const syncDoc = async (
    type: 'post' | 'page',
    doc: {
      slug?: string | null;
      title?: string | null;
      htmlContent?: string | null;
      meta?: { title?: string | null; description?: string | null; image?: unknown };
      featuredImageUrl?: string | null;
      publishedAt?: string | null;
      _status?: string | null;
    }
  ) => {
    const slug = doc.slug?.trim();
    if (!slug) return;

    const html = htmlFromPayloadDoc(doc);
    const published = doc._status === 'published';

    try {
      await syncToMarketingBackend({
        type,
        slug,
        title: doc.title ?? slug,
        content: html || doc.meta?.description || doc.title || '',
        excerpt: doc.meta?.description ?? null,
        featuredImage:
          typeof doc.featuredImageUrl === 'string'
            ? doc.featuredImageUrl
            : typeof doc.meta?.image === 'object' &&
                doc.meta.image &&
                'url' in doc.meta.image
              ? String((doc.meta.image as { url?: string }).url ?? '')
              : null,
        category: type === 'post' ? 'Blog' : undefined,
        metaTitle: doc.meta?.title ?? null,
        metaDescription: doc.meta?.description ?? null,
        published,
        publishedAt: doc.publishedAt ?? null,
      });
      synced++;
      console.log(`  ok ${type} ${slug} (${published ? 'published' : 'draft'})`);
    } catch (e) {
      failed++;
      console.error(`  fail ${type} ${slug}`, e);
    }
  };

  if (!args.pagesOnly) {
    const posts = await payload.find({
      collection: 'posts',
      limit: args.limit || 1000,
      pagination: false,
      depth: 0,
    });
    console.log(`Syncing ${posts.docs.length} posts…`);
    for (const doc of posts.docs) {
      await syncDoc('post', doc);
    }
  }

  if (!args.postsOnly) {
    const pages = await payload.find({
      collection: 'pages',
      limit: args.limit || 1000,
      pagination: false,
      depth: 0,
    });
    console.log(`Syncing ${pages.docs.length} pages…`);
    for (const doc of pages.docs) {
      await syncDoc('page', doc);
    }
  }

  console.log(`Done. synced=${synced} failed=${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
