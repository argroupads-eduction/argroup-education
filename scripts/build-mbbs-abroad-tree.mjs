#!/usr/bin/env node
/**
 * Maps MBBS Abroad countries/colleges to WordPress page slugs.
 *
 * Usage:
 *   node scripts/build-mbbs-abroad-tree.mjs
 *   node scripts/build-mbbs-abroad-tree.mjs "C:/Users/.../export.xml"
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const COUNTRIES_PATH = path.join(REPO_ROOT, 'data', 'mbbs-abroad-countries.json');
const OUT_PATH = path.join(REPO_ROOT, 'data', 'mbbs-abroad-tree.json');
const FRONTEND_OUT = path.join(REPO_ROOT, 'apps', 'frontend', 'data', 'mbbs-abroad-tree.json');
const WP_JSON_CANDIDATES = [
  path.join(REPO_ROOT, 'apps', 'frontend', 'data', 'wp-export-bundle', 'pages.json'),
  path.join(REPO_ROOT, 'data', 'wp-export', 'pages.json'),
];

const COUNTRY_WP_SLUG = {
  russia: ['study-mbbs-in-russia', 'mbbs-in-russia'],
  nepal: ['study-mbbs-in-nepal'],
  bangladesh: ['study-mbbs-in-bangladesh'],
  uzbekistan: ['study-mbbs-in-uzbekistan'],
  kazakhstan: ['mbbs-in-kazakhstan'],
  serbia: ['mbbs-in-serbia'],
  iran: ['mbbs-in-iran'],
  bosnia: ['mbbs-in-bosnia'],
  egypt: ['mbbs-in-egypt'],
  vietnam: ['mbbs-in-vietnam'],
  kyrgyzstan: ['study-mbbs-in-kyrgyzstan'],
  philippines: ['mbbs-in-philippines-3-2', 'mbbs-in-philippines'],
  georgia: ['mbbs-in-georgia'],
  china: ['study-mbbs-in-china', 'mbbs-in-china'],
  romania: ['mbbs-in-romania'],
  asia: ['mbbs-in-asia'],
};

const STOP_WORDS = new Set([
  'medical', 'college', 'institute', 'hospital', 'sciences', 'science',
  'and', 'the', 'of', 'for', 'in', 'a', 'an', 'university', 'research',
  'state', 'national', 'international', 'russia', 'nepal', 'china',
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
    pages.push({ slug: slug[1], title: decodeXmlEntities(title?.[1] || slug[1]) });
  }
  return pages;
}

function mapJsonPage(p) {
  return {
    slug: p.slug,
    title: typeof p.title === 'string' ? p.title : p.title?.rendered || p.slug,
    featuredImage: p.featuredImage || null,
  };
}

async function loadWpPages(sourceArg) {
  if (sourceArg?.endsWith('.xml')) {
    const xml = await readFile(sourceArg, 'utf8');
    return { pages: parseWxrXml(xml), source: sourceArg };
  }
  for (const wpPath of WP_JSON_CANDIDATES) {
    try {
      const raw = await readFile(wpPath, 'utf8');
      return { pages: JSON.parse(raw).map(mapJsonPage), source: wpPath };
    } catch {
      /* try next */
    }
  }
  throw new Error('No pages source found. Run npm run wp:export or pass path to .xml export.');
}

function imageForSlug(slug, pageBySlug) {
  if (!slug) return null;
  return pageBySlug.get(slug)?.featuredImage || null;
}

function findPageSlug(name, pages) {
  const key = norm(name);
  if (!key) return null;

  for (const p of pages) {
    if (norm(p.title) === key) return p.slug;
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

function resolveCountryWpSlug(countryId, slugSet) {
  const candidates = COUNTRY_WP_SLUG[countryId] ?? [`study-mbbs-in-${countryId}`, `mbbs-in-${countryId}`];
  return candidates.find((s) => slugSet.has(s)) ?? null;
}

function mapCollege(college, pages, pageBySlug, fallbackHref) {
  const slug = findPageSlug(college.name, pages);
  return {
    name: college.name,
    slug: slug || null,
    href: slug ? `/${slug}` : fallbackHref,
    image: imageForSlug(slug, pageBySlug),
  };
}

async function main() {
  const sourceArg = process.argv[2];
  const countries = JSON.parse(await readFile(COUNTRIES_PATH, 'utf8'));
  const { pages, source } = await loadWpPages(sourceArg);
  const slugSet = new Set(pages.map((p) => p.slug));
  const pageBySlug = new Map(pages.map((p) => [p.slug, p]));

  let matched = 0;
  let total = 0;
  const unmatched = [];

  const tree = {
    generatedAt: new Date().toISOString(),
    source,
    countries: countries.map((country) => {
      const wpSlug = resolveCountryWpSlug(country.id, slugSet);
      const countryFallback = country.href;

      const colleges = (country.colleges ?? []).map((c) => {
        total++;
        const mapped = mapCollege(c, pages, pageBySlug, countryFallback);
        if (mapped.slug) matched++;
        else unmatched.push({ country: country.name, college: c.name });
        return mapped;
      });

      const universities = (country.universities ?? []).map((u) => {
        const uSlug = findPageSlug(u.name, pages);
        const uHref = uSlug ? `/${uSlug}` : u.href;
        const uColleges = (u.colleges ?? []).map((c) => {
          total++;
          const mapped = mapCollege(c, pages, pageBySlug, uHref);
          if (mapped.slug) matched++;
          else unmatched.push({ country: country.name, college: c.name });
          return mapped;
        });
        return {
          id: u.id,
          name: u.name,
          href: uHref,
          slug: uSlug,
          colleges: uColleges.length ? uColleges : undefined,
        };
      });

      return {
        id: country.id,
        name: country.name,
        navLabel: country.navLabel,
        href: country.href,
        wpSlug,
        featuredImage: imageForSlug(wpSlug, pageBySlug),
        colleges: colleges.length ? colleges : undefined,
        universities: universities.length ? universities : undefined,
      };
    }),
  };

  await writeFile(OUT_PATH, JSON.stringify(tree, null, 2), 'utf8');
  await writeFile(FRONTEND_OUT, JSON.stringify(tree, null, 2), 'utf8');
  console.log(`Wrote ${OUT_PATH}`);
  console.log(`Matched ${matched}/${total} colleges/universities to WordPress pages`);
  if (unmatched.length) {
    console.log(
      'Unmatched sample:',
      unmatched.slice(0, 8).map((u) => u.college).join(', '),
      unmatched.length > 8 ? `...+${unmatched.length - 8}` : ''
    );
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
