import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
const posts = await p.blogPost.findMany({
  select: { featuredImage: true, slug: true, ogImage: true },
});
const hosts = {};
let nulls = 0,
  blob = 0,
  wp = 0,
  other = 0;
for (const post of posts) {
  const u = post.featuredImage || post.ogImage;
  if (!u) {
    nulls++;
    continue;
  }
  if (u.includes('vercel-storage') || u.includes('blob.vercel')) blob++;
  else if (u.includes('wp-content')) wp++;
  else other++;
  try {
    const h = new URL(u.startsWith('http') ? u : `https://example.com${u}`).hostname;
    hosts[h] = (hosts[h] || 0) + 1;
  } catch {
    hosts['(rel)'] = (hosts['(rel)'] || 0) + 1;
  }
}
console.log(JSON.stringify({ total: posts.length, nulls, blob, wp, other, hosts }, null, 2));
await p.$disconnect();
