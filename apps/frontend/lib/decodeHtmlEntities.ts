/** Decode common HTML entities from WordPress titles, excerpts, and text fields. */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';

  let out = text
    .replace(/&#(\d+);/g, (_, code: string) => {
      const n = Number(code);
      return Number.isFinite(n) ? String.fromCodePoint(n) : _;
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
      const n = parseInt(hex, 16);
      return Number.isFinite(n) ? String.fromCodePoint(n) : _;
    });

  const named: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&hellip;': '…',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&ldquo;': '\u201C',
    '&rdquo;': '\u201D',
    '&bull;': '•',
  };

  for (const [entity, char] of Object.entries(named)) {
    out = out.split(entity).join(char);
  }

  return out;
}

/** Strip tags and decode entities — safe for headings, titles, excerpts. */
export function plainTextFromHtml(text: string): string {
  return decodeHtmlEntities(text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

export function dedupeLinks<T extends { href: string }>(links: T[]): T[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
}
