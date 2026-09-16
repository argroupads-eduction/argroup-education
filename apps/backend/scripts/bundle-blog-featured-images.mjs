/**
 * Copy blog featured images from local public/wp-content into
 * public/images/blog-featured/ and rewrite MySQL featuredImage/ogImage
 * to stable /images/blog-featured/* paths (Amplify/Hostinger safe).
 */
import 'dotenv/config';
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '../../frontend');
const uploadsRoot = path.join(frontendRoot, 'public', 'wp-content', 'uploads');
const outDir = path.join(frontendRoot, 'public', 'images', 'blog-featured');
const mapPath = path.join(frontendRoot, 'data', 'blog-featured-map.json');

mkdirSync(outDir, { recursive: true });

const prisma = new PrismaClient();
const posts = await prisma.blogPost.findMany({
  select: { id: true, slug: true, featuredImage: true, ogImage: true },
});

function extractUploadsRel(url) {
  if (!url) return null;
  const m = String(url).match(/wp-content\/uploads\/([^?#]+)/i);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1].replace(/\\/g, '/'));
  } catch {
    return m[1].replace(/\\/g, '/');
  }
}

function safeSlugFile(slug, ext) {
  const base = slug
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
  return `${base || 'post'}${ext}`;
}

const map = {};
let copied = 0;
let updated = 0;
let missing = 0;
let skipped = 0;

for (const post of posts) {
  const sourceUrl = post.featuredImage || post.ogImage;
  if (!sourceUrl) {
    skipped++;
    continue;
  }

  // Already bundled
  if (sourceUrl.startsWith('/images/blog-featured/') || sourceUrl.startsWith('/images/blog/')) {
    skipped++;
    continue;
  }

  const rel = extractUploadsRel(sourceUrl);
  if (!rel) {
    // Keep absolute non-WP URLs (blob/CDN) as-is
    if (/^https?:\/\//i.test(sourceUrl) && !/argroupofeducation\.com\/wp-content/i.test(sourceUrl)) {
      skipped++;
      continue;
    }
    missing++;
    continue;
  }

  const srcFile = path.join(uploadsRoot, ...rel.split('/'));
  if (!existsSync(srcFile)) {
    missing++;
    continue;
  }

  const ext = path.extname(srcFile) || '.jpg';
  const fileName = safeSlugFile(post.slug, ext.toLowerCase());
  const destFile = path.join(outDir, fileName);
  cpSync(srcFile, destFile);
  const publicPath = `/images/blog-featured/${fileName}`;
  map[post.slug] = publicPath;

  await prisma.blogPost.update({
    where: { id: post.id },
    data: {
      featuredImage: publicPath,
      ogImage: publicPath,
    },
  });
  copied++;
  updated++;
}

writeFileSync(mapPath, JSON.stringify({ generatedAt: new Date().toISOString(), map }, null, 2));
console.log(JSON.stringify({ total: posts.length, copied, updated, missing, skipped, outDir }, null, 2));
await prisma.$disconnect();
