/**
 * Verify college/page slugs resolve to 200 (not 403/404).
 * Usage: node apps/frontend/scripts/verify-college-pages.mjs [baseUrl]
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.argv[2]?.replace(/\/$/, '') || 'http://localhost:3000';

const abroad = JSON.parse(readFileSync(path.join(ROOT, 'data/mbbs-abroad-tree.json'), 'utf8'));
const india = JSON.parse(readFileSync(path.join(ROOT, 'data/mbbs-india-tree.json'), 'utf8'));
const pages = JSON.parse(readFileSync(path.join(ROOT, 'data/wp-export-bundle/pages.json'), 'utf8'));
const posts = JSON.parse(readFileSync(path.join(ROOT, 'data/wp-export-bundle/posts.json'), 'utf8'));

const pageSlugs = new Set(pages.map((p) => p.slug));
const postSlugs = new Set(posts.map((p) => p.slug));

function collectUrls() {
  const urls = new Set();

  for (const country of abroad.countries) {
    urls.add(country.href);
    for (const c of country.colleges ?? []) {
      if (c.href) urls.add(c.href);
    }
    for (const u of country.universities ?? []) {
      if (u.href) urls.add(u.href);
      for (const c of u.colleges ?? []) {
        if (c.href) urls.add(c.href);
      }
    }
  }

  for (const state of india.states) {
    urls.add(state.href);
    for (const c of state.colleges) {
      if (c.href) urls.add(c.href);
    }
  }

  return [...urls].sort();
}

async function checkUrl(href) {
  const url = `${BASE}${href}`;
  const slug = href.replace(/^\//, '');
  const inBundle = pageSlugs.has(slug) ? 'page' : postSlugs.has(slug) ? 'post' : 'fallback';
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(120_000) });
    return { href, status: res.status, ok: res.ok, inBundle, finalUrl: res.url };
  } catch (e) {
    return { href, status: 0, ok: false, inBundle, error: e.message };
  }
}

const urls = collectUrls();
const russia = abroad.countries.find((c) => c.id === 'russia');
const russiaColleges = (russia?.colleges ?? []).map((c) => c.href);

console.log(`Checking ${urls.length} program URLs against ${BASE}...\n`);

const russiaResults = [];
for (const href of russiaColleges) {
  russiaResults.push(await checkUrl(href));
}

console.log('=== MBBS Russia colleges (26) ===');
for (const r of russiaResults) {
  const slug = r.href.replace(/^\//, '');
  const flag = r.ok ? 'OK' : `FAIL ${r.status}`;
  console.log(`${flag.padEnd(10)} ${r.href.padEnd(55)} source:${r.inBundle}`);
}

const bad = russiaResults.filter((r) => !r.ok);
console.log(`\nRussia failures: ${bad.length}`);

const allBad = [];
for (const href of urls) {
  const r = await checkUrl(href);
  if (!r.ok) allBad.push(r);
}

if (allBad.length) {
  console.log(`\n=== All program URL failures (${allBad.length}) ===`);
  for (const r of allBad.slice(0, 50)) {
    console.log(`${r.status} ${r.href}`);
  }
  if (allBad.length > 50) console.log(`... and ${allBad.length - 50} more`);
  process.exit(1);
}

console.log('\nAll program URLs returned 2xx.');
