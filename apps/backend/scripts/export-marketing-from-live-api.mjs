/**
 * Pull all published blogs (+ optional pages) from the live marketing API
 * into data/hostinger-marketing-db-export.json so Hostinger MySQL import
 * keeps every blog body + featuredImage URL.
 *
 * Usage:
 *   node apps/backend/scripts/export-marketing-from-live-api.mjs
 *   LIVE_SITE_URL=https://www.argroupofeducation.com node apps/backend/scripts/export-marketing-from-live-api.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dumpPath = path.resolve(
  __dirname,
  '../../../data/hostinger-marketing-db-export.json'
);

const base = (
  process.env.LIVE_SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://www.argroupofeducation.com'
).replace(/\/$/, '');

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function listAllBlogSummaries() {
  const limit = 50;
  let page = 1;
  const all = [];
  for (;;) {
    const json = await fetchJson(`${base}/api/blogs?page=${page}&limit=${limit}`);
    const rows = json.data || json.blogs || [];
    all.push(...rows);
    const pages = json.pages || Math.ceil((json.total || all.length) / limit);
    console.log(`blogs page ${page}/${pages} (+${rows.length})`);
    if (page >= pages || rows.length === 0) break;
    page += 1;
  }
  return all;
}

async function fetchBlogDetail(slug) {
  const json = await fetchJson(`${base}/api/blogs/${encodeURIComponent(slug)}`);
  return json.data || json;
}

async function main() {
  console.log('Exporting from', base);
  const summaries = await listAllBlogSummaries();
  const blogPost = [];

  for (let i = 0; i < summaries.length; i++) {
    const s = summaries[i];
    const slug = s.slug;
    process.stdout.write(`\r detail ${i + 1}/${summaries.length} ${slug}          `);
    try {
      const d = await fetchBlogDetail(slug);
      blogPost.push({
        id: d.id || s.id,
        title: d.title || s.title,
        slug,
        content: d.content || '',
        excerpt: d.excerpt || s.excerpt || '',
        featuredImage: d.featuredImage || s.featuredImage || null,
        category: d.category || s.category || 'Blog',
        tags: Array.isArray(d.tags) ? d.tags : [],
        metaTitle: d.metaTitle ?? null,
        metaDescription: d.metaDescription ?? null,
        canonicalUrl: d.canonicalUrl ?? null,
        focusKeyword: d.focusKeyword ?? null,
        keywords: Array.isArray(d.keywords) ? d.keywords : [],
        ogTitle: d.ogTitle ?? null,
        ogDescription: d.ogDescription ?? null,
        ogImage: d.ogImage || d.featuredImage || s.featuredImage || null,
        twitterTitle: d.twitterTitle ?? null,
        twitterDescription: d.twitterDescription ?? null,
        schemaJson: d.schemaJson ?? null,
        author: d.author || 'AR Group',
        published: d.published !== false,
        publishedAt: d.publishedAt || s.publishedAt || null,
        views: typeof d.views === 'number' ? d.views : 0,
        createdAt: d.createdAt || s.publishedAt || new Date().toISOString(),
        updatedAt: d.updatedAt || new Date().toISOString(),
      });
    } catch (err) {
      console.warn('\nfail', slug, err.message);
    }
  }
  console.log('\n');

  const out = {
    exportedAt: new Date().toISOString(),
    source: base,
    tables: {
      blogPost,
      sitePage: [],
      country: [],
      university: [],
      neetRankPredictorSubmission: [],
      websiteFormLead: [],
      lead: [],
      subscriber: [],
      contactSubmission: [],
      testimonial: [],
      galleryImage: [],
      adminUser: [],
      siteGlobal: [],
      pushSubscription: [],
    },
  };

  fs.mkdirSync(path.dirname(dumpPath), { recursive: true });
  fs.writeFileSync(dumpPath, JSON.stringify(out));
  const withImage = blogPost.filter((b) => b.featuredImage).length;
  console.log(
    `Wrote ${blogPost.length} blogs (${withImage} with featuredImage) → ${dumpPath}`
  );
  console.log(
    'Next: create Hostinger MySQL → prisma db push → migrate-to-hostinger-mysql.mjs import'
  );
}

await main();
