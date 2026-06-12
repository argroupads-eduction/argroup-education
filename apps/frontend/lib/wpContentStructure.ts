/** Extract structure from migrated WP HTML for SEO layout (content unchanged semantically). */

import { plainTextFromHtml } from '@/lib/decodeHtmlEntities';

function stripHtml(text: string): string {
  return plainTextFromHtml(text);
}

function slugify(text: string): string {
  return stripHtml(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

export type ContentHeading = {
  id: string;
  text: string;
  level: 2 | 3 | 4 | 5 | 6;
};

export type QuickFact = {
  label: string;
  value: string;
};

export type ParsedContentStructure = {
  html: string;
  headings: ContentHeading[];
  quickFacts: QuickFact[];
};

/** Add stable ids to h2–h6 for TOC, anchor links, and SEO. */
export function injectHeadingIds(html: string): { html: string; headings: ContentHeading[] } {
  const headings: ContentHeading[] = [];
  const used = new Set<string>();

  const htmlOut = html.replace(/<h([2-6])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, levelStr, attrs, inner) => {
    const level = Number(levelStr) as ContentHeading['level'];
    const text = stripHtml(inner);
    if (!text) return match;
    if (/id\s*=/.test(attrs)) {
      const idMatch = /id\s*=\s*["']([^"']+)["']/.exec(attrs);
      if (idMatch) headings.push({ id: idMatch[1], text, level });
      return match;
    }
    let id = slugify(text) || `section-${headings.length + 1}`;
    while (used.has(id)) id = `${id}-${headings.length + 1}`;
    used.add(id);
    headings.push({ id, text, level });
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });

  return { html: htmlOut, headings };
}

/** First 2-column table → quick facts strip (like reference site overview table). */
export function extractQuickFacts(html: string): { facts: QuickFact[]; html: string } {
  const tableMatch = html.match(/<table\b[\s\S]*?<\/table>/i);
  if (!tableMatch) return { facts: [], html };

  const table = tableMatch[0];
  const rows = [...table.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)];
  const facts: QuickFact[] = [];

  const seen = new Set<string>();
  for (const row of rows) {
    const cells = [...row[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) =>
      stripHtml(c[1])
    );
    if (cells.length >= 2 && cells[0] && cells[1]) {
      const dedupeKey = `${cells[0]}|${cells[1]}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      facts.push({ label: cells[0], value: cells[1] });
    }
  }

  if (facts.length < 3 || facts.length > 30) return { facts: [], html };

  const htmlWithout = html.replace(
    table,
    '<div class="wp-quick-facts-placeholder" aria-hidden="true"></div>'
  );
  return { facts, html: htmlWithout };
}

export function addLazyImages(html: string): string {
  let profileHeroCount = 0;

  return html.replace(/<img\b([^>]*?)>/gi, (match, attrs, offset) => {
    if (/loading\s*=/.test(attrs)) return match;

    const before = html.slice(Math.max(0, offset - 2000), offset);
    const inUniversityProfile = /wp-university-profile[\s\S]{0,2000}$/i.test(before);
    const isProfileHero = inUniversityProfile && profileHeroCount < 12;

    if (isProfileHero) {
      profileHeroCount += 1;
      if (/fetchpriority\s*=/i.test(attrs)) {
        return `<img loading="eager" decoding="async"${attrs}>`;
      }
      return `<img loading="eager" fetchpriority="high" decoding="async"${attrs}>`;
    }

    return `<img loading="lazy" decoding="async"${attrs}>`;
  });
}

/** Wrap each h2-led block in a lazy-reveal section container. */
export function wrapContentSections(html: string): string {
  /** Skip card titles (jkit image boxes) — splitting on them breaks college/state grids. */
  const H2_SECTION_SPLIT = /(?=<h2\b(?![^>]*\bbody-title\b))/i;
  const parts = html.split(H2_SECTION_SPLIT);
  if (parts.length <= 1) return html;

  return parts
    .map((part, i) => {
      const trimmed = part.trim();
      if (!trimmed) return '';
      const textLen = stripHtml(trimmed).length;
      if (textLen < 60) return trimmed;
      if (i === 0 && !/^<h2/i.test(trimmed)) return trimmed;
      return `<section class="wp-lazy-section">${trimmed}</section>`;
    })
    .filter(Boolean)
    .join('\n');
}

function eaelTableHasThead(table: string): boolean {
  const thead = table.match(/<thead\b[^>]*>[\s\S]*?<\/thead>/i)?.[0] ?? '';
  return Boolean(stripHtml(thead).trim());
}

function isKeyValueFactsTable(table: string): boolean {
  if (!/eael-data-table/i.test(table)) return false;
  if (eaelTableHasThead(table)) return false;
  const firstRow = table.match(/<tbody\b[^>]*>[\s\S]*?<tr\b[^>]*>([\s\S]*?)<\/tr>/i)?.[1] ?? '';
  return (firstRow.match(/<td\b/gi) || []).length === 2;
}

function isLabeledDataTable(table: string): boolean {
  if (!/eael-data-table/i.test(table)) return false;
  return eaelTableHasThead(table);
}

function countEaelTableColumns(table: string): number {
  const thead = table.match(/<thead\b[^>]*>[\s\S]*?<\/thead>/i)?.[0] ?? '';
  const thCount = (thead.match(/<th\b/gi) || []).length;
  if (thCount >= 2) return thCount;
  const tbody = table.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i)?.[1] ?? '';
  let max = 0;
  for (const row of tbody.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const n = (row[1].match(/<td\b/gi) || []).length;
    if (n > max) max = n;
  }
  return Math.max(2, max);
}

function addTableClass(table: string, className: string): string {
  if (new RegExp(`\\b${className}\\b`).test(table)) return table;
  return table.replace(/<table\b([^>]*)>/i, (_m, attrs: string) => {
    if (/\bclass\s*=/i.test(attrs)) {
      return `<table${attrs.replace(/\bclass\s*=\s*["']([^"']*)["']/i, `class="$1 ${className}"`)}>`;
    }
    return `<table${attrs} class="${className}">`;
  });
}

function eaelColumnClass(cols: number): string {
  if (cols >= 6) return 'wp-table-cols-many';
  if (cols === 5) return 'wp-table-cols-5';
  return `wp-table-cols-${Math.min(Math.max(cols, 2), 4)}`;
}

function tagEaelDataTable(table: string): string {
  if (!/eael-data-table/i.test(table)) return table;

  const cols = countEaelTableColumns(table);
  let tagged = addTableClass(table, eaelColumnClass(cols));
  if (isKeyValueFactsTable(table)) tagged = addTableClass(tagged, 'wp-facts-kv-table');
  else if (isLabeledDataTable(table) || cols >= 3) tagged = addTableClass(tagged, 'wp-labeled-data-table');
  return tagged;
}

/** Wrap tables for aligned layout + horizontal scroll on mobile (content unchanged). */
export function wrapContentTables(html: string): string {
  const withEaelMerged = html.replace(
    /<div\b([^>]*\beael-data-table-wrap\b[^>]*)>\s*(<table\b[\s\S]*?<\/table>)\s*<\/div>/gi,
    (_match, attrs: string, table: string) => {
      const tagged = tagEaelDataTable(table);
      if (/\bwp-table-scroll\b/.test(attrs)) {
        return `<div${attrs}>${tagged}</div>`;
      }
      if (/class\s*=\s*"/i.test(attrs)) {
        return `<div${attrs.replace(/class\s*=\s*"/i, 'class="wp-table-scroll ')}>${tagged}</div>`;
      }
      if (/class\s*=\s*'/i.test(attrs)) {
        return `<div${attrs.replace(/class\s*=\s*'/i, "class='wp-table-scroll ")}>${tagged}</div>`;
      }
      return `<div class="eael-data-table-wrap wp-table-scroll">${tagged}</div>`;
    }
  );

  return withEaelMerged.replace(/<table\b[\s\S]*?<\/table>/gi, (table, offset, source) => {
    if (table.includes('wp-table-scroll')) return table;
    const before = source.slice(Math.max(0, offset - 160), offset);
    if (/\bwp-table-scroll\b[^>]*>\s*$/i.test(before) || /\beael-data-table-wrap\b[^>]*>\s*$/i.test(before)) {
      return table;
    }
    return `<div class="wp-table-scroll">${table}</div>`;
  });
}

export function parseContentStructure(html: string): ParsedContentStructure {
  const { facts, html: afterFacts } = extractQuickFacts(html);
  const { html: withIds, headings } = injectHeadingIds(afterFacts);
  const withTables = wrapContentTables(withIds);
  const withLazy = addLazyImages(withTables);
  const wrapped = wrapContentSections(withLazy);

  return {
    html: wrapped,
    headings: headings.slice(0, 24),
    quickFacts: facts,
  };
}
