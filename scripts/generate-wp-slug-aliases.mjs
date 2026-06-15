#!/usr/bin/env node
/**
 * Build slug alias map for legacy/broken WP URLs → valid Next routes.
 * Run: node scripts/generate-wp-slug-aliases.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'apps', 'frontend', 'data');
const OUT = path.join(DATA, 'wp-slug-aliases.json');

const MANUAL = {
  'study-mbbs-in-abroad-for-indian-students': '/blog/study-mbbs-abroad-for-indian-students',
  'study-mbbs-in-abroad': '/mbbs-abroad',
  'mbbs-in-abroad': '/mbbs-abroad',
  'mbbs-admission-in-top-colleges': '/',
  'contact-ar-group-of-education-mbbs-admission-help': '/contact',
  'contact-ar-group-of-education': '/contact',
  'contact-us': '/contact',
};

function normalizeSlug(slug) {
  return slug
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function tokenSet(slug) {
  return new Set(normalizeSlug(slug).split('-').filter((t) => t.length > 2));
}

function similarity(a, b) {
  const ta = tokenSet(a);
  const tb = tokenSet(b);
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.max(ta.size, tb.size);
}

function extractLinkSlugs(html) {
  const slugs = new Set();
  const re = /https?:\/\/(?:www\.)?argroupofeducation\.com\/([^"'#?\s]+)/gi;
  let m;
  while ((m = re.exec(html))) {
    const slug = m[1].replace(/\/$/, '').split('/')[0];
    if (slug && !slug.includes('.')) slugs.add(decodeURIComponent(slug));
  }
  return slugs;
}

async function loadJson(rel) {
  return JSON.parse(await readFile(path.join(DATA, rel), 'utf8'));
}

function collectKnown(known, slug, target) {
  if (slug) known.set(normalizeSlug(slug), target);
}

async function main() {
  const [pages, posts, india, abroad, linkIndex] = await Promise.all([
    loadJson('wp-export-bundle/pages.json'),
    loadJson('wp-export-bundle/posts.json'),
    loadJson('mbbs-india-tree.json'),
    loadJson('mbbs-abroad-tree.json'),
    loadJson('wp-link-index.json'),
  ]);

  const known = new Map();
  for (const [slug, target] of Object.entries(linkIndex.wpSlugToPath ?? {})) {
    collectKnown(known, slug, target);
  }
  for (const page of pages) collectKnown(known, page.slug, `/${page.slug}`);
  for (const post of posts) collectKnown(known, post.slug, `/blog/${post.slug}`);

  for (const state of india.states ?? []) {
    for (const c of state.colleges ?? []) {
      if (c.slug) collectKnown(known, c.slug, c.href);
    }
  }
  for (const country of abroad.countries ?? []) {
    for (const c of country.colleges ?? []) {
      if (c.slug) collectKnown(known, c.slug, c.href);
    }
    for (const u of country.universities ?? []) {
      if (u.slug) collectKnown(known, u.slug, u.href);
      for (const c of u.colleges ?? []) {
        if (c.slug) collectKnown(known, c.slug, c.href);
      }
    }
  }

  const aliases = { ...MANUAL };
  const linked = new Set();
  for (const row of [...pages, ...posts]) {
    for (const s of extractLinkSlugs(row.content ?? '')) linked.add(s);
    for (const s of extractLinkSlugs(row.excerpt ?? '')) linked.add(s);
  }

  const knownSlugs = [...known.keys()];
  for (const raw of linked) {
    const slug = normalizeSlug(raw);
    if (!slug || known.has(slug) || aliases[raw] || aliases[slug]) continue;

    let best = null;
    let bestScore = 0;
    for (const candidate of knownSlugs) {
      const score = similarity(slug, candidate);
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    if (best && bestScore >= 0.82) {
      aliases[raw] = known.get(best);
    }
  }

  await writeFile(
    OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        count: Object.keys(aliases).length,
        aliases,
      },
      null,
      2
    )
  );

  console.log(`Wrote ${Object.keys(aliases).length} slug aliases → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
