/**
 * Import featured images from WP bundle URLs into Payload Media collection.
 * Updates posts/pages featuredImageUrl when import succeeds.
 *
 * Usage:
 *   npx tsx scripts/import-wp-media.mts
 *   npx tsx scripts/import-wp-media.mts --dry-run --limit=5
 */

import 'dotenv/config';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { getPayload } from 'payload';
import config from '@payload-config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUNDLE_DIR = path.resolve(__dirname, '../../../apps/frontend/data/wp-export-bundle');
const MEDIA_DIR = path.resolve(__dirname, '../public/media');

type WpItem = {
  slug: string;
  status: string;
  featuredImage: string | null;
  title: string;
};

function parseArgs(argv: string[]) {
  const limitMatch = argv.find((a) => a.startsWith('--limit='));
  const offsetMatch = argv.find((a) => a.startsWith('--offset='));
  return {
    dryRun: argv.includes('--dry-run'),
    limit: limitMatch ? parseInt(limitMatch.split('=')[1] ?? '', 10) : 0,
    offset: offsetMatch ? parseInt(offsetMatch.split('=')[1] ?? '', 10) : 0,
  };
}

function filenameFromUrl(url: string, slug: string): string {
  try {
    const u = new URL(url);
    const base = path.basename(u.pathname);
    if (base && base.includes('.')) return base.replace(/[^a-zA-Z0-9._-]/g, '-');
  } catch {
    /* fall through */
  }
  return `${slug}-featured.jpg`;
}

async function downloadToFile(url: string, dest: string): Promise<boolean> {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok || !res.body) return false;
  await pipeline(Readable.fromWeb(res.body as import('node:stream/web').ReadableStream), createWriteStream(dest));
  return true;
}

async function ensureMedia(
  payload: Awaited<ReturnType<typeof getPayload>>,
  url: string,
  slug: string,
  alt: string,
  dryRun: boolean
): Promise<number | null> {
  const filename = filenameFromUrl(url, slug);

  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    pagination: false,
    depth: 0,
  });
  if (existing.docs[0]?.id) return existing.docs[0].id as number;

  if (dryRun) return -1;

  await mkdir(MEDIA_DIR, { recursive: true });
  const filePath = path.join(MEDIA_DIR, filename);
  const ok = await downloadToFile(url, filePath);
  if (!ok) return null;

  const doc = await payload.create({
    collection: 'media',
    data: { alt: alt.slice(0, 120) },
    filePath,
    overrideAccess: true,
    context: { disableRevalidate: true },
  });
  return doc.id as number;
}

async function loadItems(): Promise<{ collection: 'posts' | 'pages'; item: WpItem }[]> {
  const posts = JSON.parse(await readFile(path.join(BUNDLE_DIR, 'posts.json'), 'utf8')) as WpItem[];
  const pages = JSON.parse(await readFile(path.join(BUNDLE_DIR, 'pages.json'), 'utf8')) as WpItem[];
  return [
    ...posts.map((item) => ({ collection: 'posts' as const, item })),
    ...pages.map((item) => ({ collection: 'pages' as const, item })),
  ];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const payload = await getPayload({ config });
  const rows = await loadItems();

  const withImage = rows.filter(
    ({ item }) => item.status === 'publish' && item.featuredImage?.startsWith('http')
  );
  const slice =
    args.limit > 0
      ? withImage.slice(args.offset, args.offset + args.limit)
      : withImage.slice(args.offset);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`Processing ${slice.length} featured images…`);

  for (const { collection, item } of slice) {
    const url = item.featuredImage!;
    try {
      const mediaId = await ensureMedia(payload, url, item.slug, item.title, args.dryRun);
      if (mediaId == null) {
        failed++;
        continue;
      }

      if (!args.dryRun && mediaId > 0) {
        const existing = await payload.find({
          collection,
          where: { slug: { equals: item.slug } },
          limit: 1,
          pagination: false,
          depth: 0,
        });
        const doc = existing.docs[0];
        if (doc) {
          const imageField = collection === 'posts' ? 'heroImage' : 'featuredImage';
          await payload.update({
            collection,
            id: doc.id,
            data: {
              featuredImageUrl: url,
              [imageField]: mediaId,
            },
            overrideAccess: true,
            context: { disableBackendSync: true, disableRevalidate: true },
          });
        }
      }

      imported++;
      if (imported % 25 === 0) console.log(`  …${imported}`);
    } catch (e) {
      failed++;
      console.error(`  fail ${collection}/${item.slug}`, e);
    }
  }

  skipped = withImage.length - slice.length;
  console.log(`Done. imported=${imported} failed=${failed} skipped=${skipped} dryRun=${args.dryRun}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
