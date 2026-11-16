import { rewriteSingleWpMediaUrl } from '@/lib/wpMediaUrl';

const IMG_SRC =
  /\b(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["']/gi;

/** Collect unique image URLs from HTML content (inline blog/page images). */
export function extractHtmlImageUrls(html: string | null | undefined): string[] {
  if (!html?.trim()) return [];

  const seen = new Set<string>();
  const out: string[] = [];

  for (const match of html.matchAll(IMG_SRC)) {
    const raw = match[1]?.trim();
    if (!raw || raw.startsWith('data:')) continue;

    const normalized = rewriteSingleWpMediaUrl(raw);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }

  return out;
}
