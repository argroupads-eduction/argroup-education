'use strict';

/**
 * Auto internal links for Strapi → marketing BlogPost HTML.
 * Matches plain phrases (and slug/title variants) to published /blog/{slug} URLs.
 * Preserves existing <a> tags. Safe to run on every Publish.
 */

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function titleCaseWords(s) {
  return String(s)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      if (/^(md|ms|mbbs|neet|pg|bams|bhms|aiims|nri|ug|in|of|for|to|and|vs|the|a|an|on|with)$/i.test(w)) {
        const low = w.toLowerCase();
        if (low === 'md' || low === 'ms') return w.toUpperCase();
        if (low === 'mbbs' || low === 'neet' || low === 'pg' || low === 'bams' || low === 'bhms' || low === 'aiims' || low === 'nri' || low === 'ug') {
          return w.toUpperCase();
        }
        return low;
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

function normalizeAcronyms(s) {
  return String(s)
    .replace(/\bMd\s*\/?\s*Ms\b/gi, 'MD/MS')
    .replace(/\bMD\s+MS\b/g, 'MD/MS')
    .replace(/\bNeet\s*Pg\b/gi, 'NEET PG')
    .replace(/\bMbbs\b/gi, 'MBBS')
    .replace(/\bBams\b/gi, 'BAMS')
    .replace(/\bBhms\b/gi, 'BHMS')
    .replace(/\bAiims\b/gi, 'AIIMS')
    .replace(/\bNri\b/gi, 'NRI');
}

function phrasesFromSlug(slug) {
  const base = String(slug || '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/-and-/gi, ' and ')
    .replace(/-/g, ' ')
    .trim();
  if (base.length < 12) return [];
  const titled = normalizeAcronyms(titleCaseWords(base));
  const mdmsSlash = titled.replace(/\bMD\s+MS\b/g, 'MD/MS');
  const out = [titled, mdmsSlash];
  // "Top 10 Pg Medical Colleges In India" → also without "Top 10"
  const withoutTop = titled.replace(/^Top\s+\d+\s+/i, '').trim();
  if (withoutTop.length >= 16) out.push(withoutTop);
  return out;
}

function phrasesFromTitle(title) {
  const t = String(title || '')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length < 16) return [];
  const cut = (s) =>
    s
      .replace(/\s*[:|].*$/, '')
      .replace(/\s*[-–—].*$/, '')
      .replace(/\s*202\d.*$/i, '')
      .replace(/\?\s*$/, '')
      .trim();
  const variants = [t, cut(t), normalizeAcronyms(cut(t))];
  return [...new Set(variants.map((v) => v.trim()).filter((v) => v.length >= 16))];
}

/**
 * @param {{ slug: string, title?: string, focusKeyword?: string|null }[]} posts
 * @param {string} [currentSlug]
 */
function buildInterlinkCatalog(posts, currentSlug) {
  /** @type {{ phrase: string, slug: string }[]} */
  const items = [];
  const seenPhrase = new Set();

  for (const post of posts || []) {
    const slug = String(post?.slug || '')
      .trim()
      .toLowerCase();
    // Only clean URL slugs — skip broken rows with spaces / uppercase junk
    if (!slug || slug === currentSlug) continue;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) continue;

    const phrases = [
      ...phrasesFromTitle(post.title),
      ...phrasesFromSlug(slug),
    ];
    if (post.focusKeyword && String(post.focusKeyword).trim().length >= 12) {
      phrases.push(String(post.focusKeyword).trim());
    }

    for (const phrase of phrases) {
      const key = phrase.toLowerCase();
      if (seenPhrase.has(key)) continue;
      if (key.length < 12 || key.length > 90) continue;
      // Avoid ultra-generic single tokens
      if (/^(neet pg|mbbs|md\/ms|india)$/i.test(phrase)) continue;
      seenPhrase.add(key);
      items.push({ phrase, slug });
    }
  }

  items.sort((a, b) => b.phrase.length - a.phrase.length);
  return items;
}

/**
 * Replace first match of each catalog phrase in HTML text nodes (not inside tags / existing anchors).
 * @param {string} html
 * @param {{ slug: string, title?: string, focusKeyword?: string|null }[]} posts
 * @param {{ currentSlug?: string, maxLinks?: number }} [opts]
 */
function applyBlogInterlinks(html, posts, opts = {}) {
  let src = String(html || '');
  if (!src.trim() || !posts?.length) return src;

  const currentSlug = opts.currentSlug || '';
  const maxLinks = Number(opts.maxLinks) > 0 ? Number(opts.maxLinks) : 14;
  const catalog = buildInterlinkCatalog(posts, currentSlug);
  if (!catalog.length) return src;

  // Park existing anchors so we never nest links
  const parked = [];
  src = src.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, (m) => {
    const i = parked.length;
    parked.push(m);
    return `\uE000A${i}\uE001`;
  });

  const usedSlugs = new Set();
  let linkCount = 0;

  for (const { phrase, slug } of catalog) {
    if (linkCount >= maxLinks) break;
    if (usedSlugs.has(slug)) continue;

    const re = new RegExp(escapeRegex(phrase), 'i');
    let replaced = false;

    // Split into tags vs text; only mutate text segments
    src = src
      .split(/(<[^>]+>)/g)
      .map((part) => {
        if (replaced) return part;
        if (!part || part.startsWith('<')) return part;
        if (part.includes('\uE000A')) return part;
        const m = re.exec(part);
        if (!m) return part;
        replaced = true;
        usedSlugs.add(slug);
        linkCount += 1;
        const before = part.slice(0, m.index);
        const hit = m[0];
        const after = part.slice(m.index + hit.length);
        return `${before}<a href="/blog/${slug}">${hit}</a>${after}`;
      })
      .join('');
  }

  src = src.replace(/\uE000A(\d+)\uE001/g, (_, i) => parked[Number(i)] || '');
  return src;
}

module.exports = {
  applyBlogInterlinks,
  buildInterlinkCatalog,
  phrasesFromSlug,
  phrasesFromTitle,
};
