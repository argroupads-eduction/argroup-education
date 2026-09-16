#!/usr/bin/env node
/**
 * Build compact slug → internal path index for WP HTML link rewriting.
 * Run: node scripts/generate-wp-link-index.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FRONTEND_DATA = path.join(ROOT, 'apps', 'frontend', 'data');

const HUB_SLUGS = {
  'mbbs-in-india': '/mbbs-india',
  'study-mbbs-in-abroad': '/mbbs-abroad',
  'mbbs-in-abroad': '/mbbs-abroad',
  'md-ms': '/md-ms',
  'mbbs-admission-in-top-colleges': '/',
  home: '/',
  contact: '/contact',
  'contact-ar-group-of-education-mbbs-admission-help': '/contact',
  'contact-ar-group-of-education': '/contact',
  'contact-us': '/contact',
  about: '/about',
  blog: '/blog',
};

async function loadJson(rel) {
  const raw = await readFile(path.join(FRONTEND_DATA, rel), 'utf8');
  return JSON.parse(raw);
}

function addCollege(map, college) {
  if (college?.slug) map[college.slug] = college.href;
}

function walkIndiaTree(states, map) {
  for (const state of states) {
    if (state.wpSlug) map[state.wpSlug] = state.href;
    for (const college of state.colleges ?? []) addCollege(map, college);
  }
}

function walkAbroadTree(countries, map) {
  for (const country of countries) {
    if (country.wpSlug) map[country.wpSlug] = country.href;
    for (const college of country.colleges ?? []) addCollege(map, college);
    for (const uni of country.universities ?? []) {
      if (uni.slug) map[uni.slug] = uni.href;
      for (const college of uni.colleges ?? []) addCollege(map, college);
    }
  }
}

async function main() {
  const [pages, posts, indiaTree, abroadTree] = await Promise.all([
    loadJson('wp-export-bundle/pages.json'),
    loadJson('wp-export-bundle/posts.json'),
    loadJson('mbbs-india-tree.json'),
    loadJson('mbbs-abroad-tree.json'),
  ]);

  const wpSlugToPath = { ...HUB_SLUGS };
  walkIndiaTree(indiaTree.states ?? [], wpSlugToPath);
  walkAbroadTree(abroadTree.countries ?? [], wpSlugToPath);

  for (const page of pages) {
    if (page.slug && !wpSlugToPath[page.slug]) {
      wpSlugToPath[page.slug] = `/${page.slug}`;
    }
  }

  const pageSlugs = pages.map((p) => p.slug).filter(Boolean);
  const postSlugs = posts.map((p) => p.slug).filter(Boolean);

  const out = {
    generatedAt: new Date().toISOString(),
    wpSlugToPath,
    pageSlugs,
    postSlugs,
  };

  const outPath = path.join(FRONTEND_DATA, 'wp-link-index.json');
  await writeFile(outPath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(`  wpSlugToPath: ${Object.keys(wpSlugToPath).length}`);
  console.log(`  pageSlugs: ${pageSlugs.length}, postSlugs: ${postSlugs.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
