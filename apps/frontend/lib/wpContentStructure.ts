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
      let id = (idMatch?.[1] || '').trim();
      if (!id) {
        id = slugify(text) || `section-${headings.length + 1}`;
      }
      while (used.has(id)) id = `${id}-${headings.length + 1}`;
      used.add(id);
      headings.push({ id, text, level });
      if (idMatch?.[1] === id) return match;
      return `<h${level}${attrs.replace(/\sid\s*=\s*["'][^"']*["']/i, '')} id="${id}">${inner}</h${level}>`;
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
export function extractQuickFactsFromHtml(html: string): { facts: QuickFact[]; html: string } {
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

function countCellsInRow(rowHtml: string): number {
  return (rowHtml.match(/<t[dh]\b/gi) || []).length;
}

/** Column count follows the WordPress row, not a fixed 2-column layout. */
function countEaelTableColumns(table: string): number {
  const headRow = table.match(/<thead\b[^>]*>[\s\S]*?<tr\b[^>]*>([\s\S]*?)<\/tr>/i)?.[1] ?? '';
  const headCount = countCellsInRow(headRow);
  if (headCount >= 1) return headCount;
  const bodyRow =
    table.match(/<tbody\b[^>]*>[\s\S]*?<tr\b[^>]*>([\s\S]*?)<\/tr>/i)?.[1] ??
    table.match(/<tr\b[^>]*>([\s\S]*?)<\/tr>/i)?.[1] ??
    '';
  return Math.max(1, countCellsInRow(bodyRow));
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
  if (cols <= 1) return 'wp-table-cols-1';
  return `wp-table-cols-${cols}`;
}

/** WP exports often put header cells in the first tbody row instead of thead. */
function promoteHeaderRowToThead(table: string): string {
  if (/<thead\b/i.test(table)) return table;

  const tbodyMatch = table.match(/<tbody\b([^>]*)>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return table;

  const tbodyInner = tbodyMatch[2];
  const rowMatch = tbodyInner.match(/^\s*(<tr\b[^>]*>[\s\S]*?<\/tr>)/i);
  if (!rowMatch) return table;

  const firstRow = rowMatch[1];
  const cells = [...firstRow.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)];
  if (cells.length < 2) return table;

  const isHeader = cells.every((cell) => /<(?:b|strong)\b/i.test(cell[1]));
  if (!isHeader) return table;

  const headerRow = firstRow.replace(/<td\b/gi, '<th').replace(/<\/td>/gi, '</th>');
  const restTbody = tbodyInner.slice(rowMatch[0].length);

  return table.replace(
    /<tbody\b[^>]*>[\s\S]*?<\/tbody>/i,
    `<thead>${headerRow}</thead><tbody>${restTbody}</tbody>`
  );
}

function injectDataLabels(table: string): string {
  const thead = table.match(/<thead\b[^>]*>([\s\S]*?)<\/thead>/i)?.[1] ?? '';
  const labels = [...thead.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((match) =>
    stripHtml(match[1]).replace(/"/g, '&quot;')
  );
  if (labels.length === 0) return table;

  return table.replace(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i, (_match, body: string) => {
    const newBody = body.replace(
      /<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi,
      (_row, trAttrs: string, row: string) => {
        let col = 0;
        const newRow = row.replace(/<td\b([^>]*)>/gi, (_td, tdAttrs: string) => {
          const label = labels[col] ?? '';
          col += 1;
          if (/data-label=/i.test(tdAttrs)) return `<td${tdAttrs}>`;
          return `<td${tdAttrs} data-label="${label}">`;
        });
        return `<tr${trAttrs}>${newRow}</tr>`;
      }
    );
    return `<tbody>${newBody}</tbody>`;
  });
}

function tagTableStructure(table: string): string {
  let tagged = promoteHeaderRowToThead(table);
  const cols = countEaelTableColumns(tagged);
  tagged = addTableClass(tagged, eaelColumnClass(cols));

  if (/eael-data-table/i.test(tagged)) {
    if (isKeyValueFactsTable(tagged)) tagged = addTableClass(tagged, 'wp-facts-kv-table');
    else if (isLabeledDataTable(tagged) || cols >= 3) tagged = addTableClass(tagged, 'wp-labeled-data-table');
  } else if (cols >= 2 && eaelTableHasThead(tagged)) {
    tagged = addTableClass(tagged, 'wp-labeled-data-table');
  }

  if (firstColumnIsIndex(tagged)) tagged = addTableClass(tagged, 'table-index-col');

  return injectDataLabels(tagged);
}

function cellPlainText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
}

/** First column is a serial number, so it can stay narrow and centered. */
function firstColumnIsIndex(table: string): boolean {
  const head = table.match(/<thead\b[^>]*>[\s\S]*?<\/thead>/i)?.[0] ?? '';
  const firstHead = head.match(/<th\b[^>]*>([\s\S]*?)<\/th>/i)?.[1] ?? '';
  const label = cellPlainText(firstHead);
  if (label) {
    return /^(s\.?\s*no\.?|sr\.?\s*no\.?|serial(?:\s*no\.?)?|rank|#|no\.?)$/i.test(label);
  }

  const body = table.match(/<tbody\b[^>]*>[\s\S]*?<\/tbody>/i)?.[0] ?? '';
  const rows = [...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].slice(0, 4);
  if (rows.length < 2) return false;
  let numeric = 0;
  for (const row of rows) {
    const cell = row[1].match(/<td\b[^>]*>([\s\S]*?)<\/td>/i)?.[1] ?? '';
    if (/^\d{1,3}$/.test(cellPlainText(cell))) numeric += 1;
  }
  return numeric >= Math.min(2, rows.length);
}

function withTableWrapperClass(attrs: string): string {
  if (/\btable-wrapper\b/.test(attrs)) return attrs;
  if (/class\s*=\s*"/i.test(attrs)) {
    return attrs.replace(/class\s*=\s*"/i, 'class="table-wrapper ');
  }
  if (/class\s*=\s*'/i.test(attrs)) {
    return attrs.replace(/class\s*=\s*'/i, "class='table-wrapper ");
  }
  return `${attrs} class="table-wrapper"`;
}

function tagEaelDataTable(table: string): string {
  if (!/eael-data-table/i.test(table)) return table;
  return tagTableStructure(table);
}

/** Wrap tables for aligned layout + horizontal scroll on mobile (content unchanged). */
export function wrapContentTables(html: string): string {
  const withEaelMerged = html.replace(
    /<div\b([^>]*\beael-data-table-wrap\b[^>]*)>\s*(<table\b[\s\S]*?<\/table>)\s*<\/div>/gi,
    (_match, attrs: string, table: string) => {
      const tagged = tagEaelDataTable(table);
      const wrappedAttrs = withTableWrapperClass(
        /\bwp-table-scroll\b/.test(attrs)
          ? attrs
          : /class\s*=\s*"/i.test(attrs)
            ? attrs.replace(/class\s*=\s*"/i, 'class="wp-table-scroll ')
            : /class\s*=\s*'/i.test(attrs)
              ? attrs.replace(/class\s*=\s*'/i, "class='wp-table-scroll ")
              : `${attrs} class="eael-data-table-wrap wp-table-scroll"`
      );
      return `<div${wrappedAttrs}>${tagged}</div>`;
    }
  );

  const withBareTables = withEaelMerged.replace(/<table\b[\s\S]*?<\/table>/gi, (table, offset, source) => {
    const tagged = tagTableStructure(table);
    const before = source.slice(Math.max(0, offset - 180), offset);
    if (/\b(?:wp-table-scroll|table-wrapper|eael-data-table-wrap)\b[^>]*>\s*$/i.test(before)) {
      return tagged;
    }
    return `<div class="wp-table-scroll table-wrapper">${tagged}</div>`;
  });

  return withBareTables.replace(
    /<([a-z0-9]+)\b([^>]*\bwp-table-scroll\b[^>]*)>/gi,
    (full, tag: string, attrs: string) => {
      if (/\btable-wrapper\b/.test(attrs)) return full;
      return `<${tag}${withTableWrapperClass(attrs)}>`;
    }
  );
}

export type ParseContentStructureOptions = {
  /** When false, keep 2-column tables in the article (Payload / blog data tables). */
  extractQuickFacts?: boolean;
};

export function parseContentStructure(
  html: string,
  options: ParseContentStructureOptions = {},
): ParsedContentStructure {
  const extractQuickFacts = options.extractQuickFacts !== false;
  const { facts, html: afterFacts } = extractQuickFacts
    ? extractQuickFactsFromHtml(html)
    : { facts: [], html };
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
