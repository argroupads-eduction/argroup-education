import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
const posts = await p.blogPost.findMany({
  select: {
    slug: true,
    title: true,
    publishedAt: true,
    createdAt: true,
    updatedAt: true,
    featuredImage: true,
    metaTitle: true,
  },
  orderBy: { publishedAt: 'desc' },
});

const byMonth = {};
for (const post of posts) {
  const d = post.publishedAt || post.createdAt;
  const key = d ? d.toISOString().slice(0, 7) : 'null';
  byMonth[key] = (byMonth[key] || 0) + 1;
}

const fromMarch = posts.filter((post) => {
  const d = post.publishedAt || post.createdAt;
  return d && d >= new Date('2026-03-01');
});

console.log(
  JSON.stringify(
    {
      total: posts.length,
      byMonth,
      fromMarch2026: fromMarch.length,
      newest20: posts.slice(0, 20).map((p) => ({
        slug: p.slug,
        publishedAt: p.publishedAt,
        img: Boolean(p.featuredImage),
        seo: Boolean(p.metaTitle),
      })),
      marchSample: fromMarch.slice(0, 15).map((p) => ({
        slug: p.slug,
        publishedAt: p.publishedAt,
      })),
    },
    null,
    2
  )
);

await p.$disconnect();
