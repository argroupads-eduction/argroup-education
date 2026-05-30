#!/usr/bin/env node
/**
 * Maps MBBS India states/colleges to WordPress page slugs.
 * Sources (first available): WP XML export, data/wp-export/pages.json
 *
 * Usage:
 *   node scripts/build-mbbs-india-tree.mjs
 *   node scripts/build-mbbs-india-tree.mjs "C:/Users/.../export.xml"
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const STATES_PATH = path.join(REPO_ROOT, 'data', 'mbbs-india-states.json');
const OUT_PATH = path.join(REPO_ROOT, 'data', 'mbbs-india-tree.json');
const FRONTEND_OUT = path.join(REPO_ROOT, 'apps', 'frontend', 'data', 'mbbs-india-tree.json');
const WP_JSON = path.join(REPO_ROOT, 'data', 'wp-export', 'pages.json');

const STATE_WP_SLUG = {
  up: 'mbbs-in-up',
  haryana: 'mbbs-in-haryana',
  rajasthan: 'mbbs-in-rajasthan',
  maharashtra: 'mbbs-in-maharashtra',
  karnataka: 'mbbs-in-karnataka',
  mp: 'mbbs-in-madhya-pradesh',
  bihar: 'mbbs-in-bihar',
  uttarakhand: 'mbbs-in-uttarakhand',
  'himachal-pradesh': 'mbbs-in-himachal-pradesh',
  delhi: 'mbbs-in-delhi',
  chhattisgarh: 'mbbs-in-chhattisgarh',
  jharkhand: 'mbbs-in-jharkhand',
  sikkim: 'mbbs-in-sikkim',
  pondicherry: 'mbbs-in-pondicherry',
  kerala: 'mbbs-in-kerala',
  'west-bengal': 'mbbs-in-west-bengal',
  'tamil-nadu': 'mbbs-in-tamil-nadu',
};

const STOP_WORDS = new Set([
  'medical', 'college', 'institute', 'hospital', 'sciences', 'science',
  'and', 'the', 'of', 'for', 'in', 'a', 'an', 'university', 'research',
]);

function norm(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/&[^;]+;/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function decodeXmlEntities(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

/** Parse WordPress WXR XML into [{ slug, title }] pages. */
function parseWxrXml(xml) {
  const pages = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml))) {
    const block = m[1];
    const type = block.match(/<wp:post_type><!\[CDATA\[([^\]]+)\]\]><\/wp:post_type>/);
    if (!type || type[1] !== 'page') continue;
    const status = block.match(/<wp:status><!\[CDATA\[([^\]]+)\]\]><\/wp:status>/);
    if (!status || status[1] !== 'publish') continue;
    const slug = block.match(/<wp:post_name><!\[CDATA\[([^\]]+)\]\]><\/wp:post_name>/);
    const title = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/);
    if (!slug?.[1]) continue;
    pages.push({
      slug: slug[1],
      title: decodeXmlEntities(title?.[1] || slug[1]),
    });
  }
  return pages;
}

async function loadWpPages(sourceArg) {
  if (sourceArg && sourceArg.endsWith('.xml')) {
    console.log('Reading WordPress XML:', sourceArg);
    const xml = await readFile(sourceArg, 'utf8');
    return { pages: parseWxrXml(xml), source: sourceArg };
  }
  try {
    const raw = await readFile(WP_JSON, 'utf8');
    const pages = JSON.parse(raw).map((p) => ({
      slug: p.slug,
      title: p.title?.rendered || p.title || p.slug,
    }));
    return { pages, source: 'data/wp-export/pages.json' };
  } catch {
    throw new Error('No pages source found. Run npm run wp:export or pass path to .xml export.');
  }
}

function findPageSlug(collegeName, pages) {
  const key = norm(collegeName);
  if (!key) return null;

  for (const p of pages) {
    const t = norm(p.title);
    if (t === key) return p.slug;
  }

  for (const p of pages) {
    const t = norm(p.title);
    if (t.includes(key) || key.includes(t)) return p.slug;
  }

  const words = key.split(' ').filter((w) => w.length > 3 && !STOP_WORDS.has(w));
  let best = null;
  let bestScore = 0;
  for (const p of pages) {
    const score = words.filter((w) => p.slug.includes(w)).length;
    if (score > bestScore && score >= Math.min(2, words.length)) {
      bestScore = score;
      best = p.slug;
    }
  }
  return best;
}

async function main() {
  const sourceArg = process.argv[2];
  const states = JSON.parse(await readFile(STATES_PATH, 'utf8'));
  const { pages, source } = await loadWpPages(sourceArg);

  const slugSet = new Set(pages.map((p) => p.slug));
  let matched = 0;
  let total = 0;
  const unmatched = [];

  const tree = {
    generatedAt: new Date().toISOString(),
    source,
    states: states.map((state) => {
      const wpSlug = STATE_WP_SLUG[state.id];
      return {
        id: state.id,
        name: state.name,
        navLabel: state.navLabel,
        href: state.href,
        wpSlug: wpSlug && slugSet.has(wpSlug) ? wpSlug : null,
        colleges: state.colleges.map((college) => {
          total++;
          const slug = findPageSlug(college.name, pages);
          if (slug) matched++;
          else unmatched.push({ state: state.name, college: college.name });
          return {
            name: college.name,
            city: college.city,
            slug: slug || null,
            href: slug ? `/${slug}` : state.href,
          };
        }),
      };
    }),
  };

  await writeFile(OUT_PATH, JSON.stringify(tree, null, 2), 'utf8');
  await writeFile(FRONTEND_OUT, JSON.stringify(tree, null, 2), 'utf8');
  console.log(`Wrote ${OUT_PATH}`);
  console.log(`Wrote ${FRONTEND_OUT}`);
  console.log(`Matched ${matched}/${total} colleges to WordPress pages`);
  if (unmatched.length) {
    console.log('Unmatched:', unmatched.slice(0, 5).map((u) => u.college).join(', '), unmatched.length > 5 ? `...+${unmatched.length - 5}` : '');
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
