import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const posts = await prisma.blogPost.findMany({
  where: { published: true },
  orderBy: { publishedAt: 'desc' },
  select: {
    id: true,
    title: true,
    slug: true,
    excerpt: true,
    featuredImage: true,
    category: true,
    publishedAt: true,
    createdAt: true,
  },
});

const mapped = posts.map((post) => ({
  id: post.id,
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt,
  featuredImage: post.featuredImage,
  category: post.category,
  publishedAt: (post.publishedAt ?? post.createdAt).toISOString(),
}));

const dest = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../frontend/data/blog-index-fallback.json'
);
writeFileSync(
  dest,
  JSON.stringify({ generatedAt: new Date().toISOString(), total: mapped.length, posts: mapped })
);
console.log('wrote', dest, 'count', mapped.length);
await prisma.$disconnect();
