/** Extract structure from migrated WP HTML for SEO layout (content unchanged semantically). */

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
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

  for (const row of rows) {
    const cells = [...row[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) =>
      stripHtml(c[1])
    );
    if (cells.length >= 2 && cells[0] && cells[1]) {
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
  return html.replace(/<img\b([^>]*?)>/gi, (match, attrs) => {
    if (/loading\s*=/.test(attrs)) return match;
    return `<img loading="lazy" decoding="async"${attrs}>`;
  });
}

/** Wrap each h2-led block in a lazy-reveal section container. */
export function wrapContentSections(html: string): string {
  const parts = html.split(/(?=<h2\b)/i);
  if (parts.length <= 1) return html;

  return parts
    .map((part, i) => {
      const trimmed = part.trim();
      if (!trimmed) return '';
      if (i === 0 && !/^<h2/i.test(trimmed)) return trimmed;
      return `<section class="wp-lazy-section">${trimmed}</section>`;
    })
    .join('\n');
}

/** Wrap tables for aligned layout + horizontal scroll on mobile (content unchanged). */
export function wrapContentTables(html: string): string {
  return html.replace(/<table\b[\s\S]*?<\/table>/gi, (table) => {
    if (table.includes('wp-table-scroll')) return table;
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
