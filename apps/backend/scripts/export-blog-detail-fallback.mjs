/**
 * Export full BlogPost rows for offline/detail fallback when MySQL is unreachable.
 *   node apps/backend/scripts/export-blog-detail-fallback.mjs
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();
const posts = await prisma.blogPost.findMany({
  where: { published: true },
  orderBy: { publishedAt: 'desc' },
});

const mapped = posts.map((post) => ({
  id: post.id,
  title: post.title,
  slug: post.slug,
  content: post.content || '',
  excerpt: post.excerpt || '',
  featuredImage: post.featuredImage,
  category: post.category,
  tags: post.tags,
  author: post.author,
  metaTitle: post.metaTitle,
  metaDescription: post.metaDescription,
  canonicalUrl: post.canonicalUrl,
  keywords: post.keywords,
  schemaJson: post.schemaJson ?? null,
  publishedAt: (post.publishedAt ?? post.createdAt).toISOString(),
  createdAt: post.createdAt.toISOString(),
  updatedAt: post.updatedAt.toISOString(),
  published: true,
}));

const dest = path.resolve(__dirname, '../../frontend/data/blog-detail-fallback.json');
writeFileSync(
  dest,
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    total: mapped.length,
    posts: mapped,
  })
);
console.log('wrote', dest, 'count', mapped.length, 'mb', +(Buffer.byteLength(JSON.stringify(mapped)) / 1024 / 1024).toFixed(2));
await prisma.$disconnect();
