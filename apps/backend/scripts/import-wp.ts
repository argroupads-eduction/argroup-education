/**
 * Import WordPress export JSON into PostgreSQL via Prisma.
 *
 * Prereqs:
 *   1. node scripts/wp-migration/export-wp.mjs
 *   2. DATABASE_URL in apps/backend/.env
 *   3. npx prisma migrate dev (from apps/backend)
 *
 * Usage (from apps/backend):
 *   npx ts-node scripts/import-wp.ts
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REPO_ROOT = path.resolve(__dirname, '../../..');
const EXPORT_DIR = path.join(REPO_ROOT, 'data', 'wp-export');

const HOME_SLUG = 'mbbs-admission-in-top-colleges';

type WpItem = {
  wpId: number;
  type: 'page' | 'post';
  slug: string;
  link: string;
  title: string;
  content: string;
  excerpt: string;
  status: string;
  date: string;
  featuredImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  keywords: string[];
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseExcerpt(item: WpItem): string {
  const plain = stripHtml(item.excerpt);
  if (plain) return plain.slice(0, 500);
  return stripHtml(item.content).slice(0, 500);
}

function parseCategory(item: WpItem): string {
  const t = stripHtml(item.title).toLowerCase();
  if (t.includes('neet')) return 'NEET';
  if (t.includes('mbbs') && t.includes('abroad')) return 'MBBS Abroad';
  if (t.includes('mbbs')) return 'MBBS';
  return 'Blog';
}

async function loadJson<T>(file: string): Promise<T> {
  const raw = await readFile(path.join(EXPORT_DIR, file), 'utf8');
  return JSON.parse(raw) as T;
}

async function importPosts(posts: WpItem[]) {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of posts) {
    if (item.status !== 'publish') {
      skipped += 1;
      continue;
    }

    const data = {
      wpId: item.wpId,
      title: stripHtml(item.title),
      slug: item.slug,
      content: item.content,
      excerpt: parseExcerpt(item),
      featuredImage: item.featuredImage,
      category: parseCategory(item),
      tags: item.keywords ?? [],
      metaTitle: item.metaTitle,
      metaDescription: item.metaDescription,
      canonicalUrl: item.canonicalUrl,
      keywords: item.keywords ?? [],
      published: true,
      publishedAt: new Date(item.date),
    };

    const existing = await prisma.blogPost.findUnique({ where: { slug: item.slug } });
    if (existing) {
      await prisma.blogPost.update({ where: { slug: item.slug }, data });
      updated += 1;
    } else {
      await prisma.blogPost.create({ data });
      created += 1;
    }
  }

  return { created, updated, skipped };
}

async function importPages(pages: WpItem[]) {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of pages) {
    if (item.status !== 'publish') {
      skipped += 1;
      continue;
    }

    if (item.slug === HOME_SLUG) {
      skipped += 1;
      continue;
    }

    const data = {
      wpId: item.wpId,
      title: stripHtml(item.title),
      slug: item.slug,
      content: item.content,
      excerpt: parseExcerpt(item) || null,
      featuredImage: item.featuredImage,
      metaTitle: item.metaTitle,
      metaDescription: item.metaDescription,
      canonicalUrl: item.canonicalUrl,
      keywords: item.keywords ?? [],
      published: true,
      publishedAt: new Date(item.date),
    };

    const existing = await prisma.sitePage.findUnique({ where: { slug: item.slug } });
    if (existing) {
      await prisma.sitePage.update({ where: { slug: item.slug }, data });
      updated += 1;
    } else {
      await prisma.sitePage.create({ data });
      created += 1;
    }
  }

  return { created, updated, skipped };
}

async function main() {
  console.log('Loading export from', EXPORT_DIR);

  const posts = await loadJson<WpItem[]>('posts.json');
  const pages = await loadJson<WpItem[]>('pages.json');

  console.log(`Importing ${posts.length} posts...`);
  const postStats = await importPosts(posts);
  console.log('  posts:', postStats);

  console.log(`Importing ${pages.length} pages (home slug skipped)...`);
  const pageStats = await importPages(pages);
  console.log('  pages:', pageStats);

  const [postCount, pageCount] = await Promise.all([
    prisma.blogPost.count(),
    prisma.sitePage.count(),
  ]);

  console.log('\nDatabase totals:');
  console.log(`  BlogPost: ${postCount}`);
  console.log(`  SitePage: ${pageCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
