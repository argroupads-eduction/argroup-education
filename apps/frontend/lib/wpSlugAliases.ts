import aliasData from '@/data/wp-slug-aliases.json';

const ALIASES = aliasData.aliases as Record<string, string>;

function normalizeKey(slug: string): string {
  return slug
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, '-');
}

/** Legacy / mistyped WP slugs → internal Next.js path (308 redirect). */
export function resolveSlugAlias(slugPath: string): string | null {
  const raw = slugPath.trim().replace(/^\/+|\/+$/g, '');
  if (!raw) return null;

  const direct = ALIASES[raw] ?? ALIASES[normalizeKey(raw)];
  if (direct) return direct;

  const decoded = decodeURIComponent(raw);
  if (decoded !== raw) {
    return ALIASES[decoded] ?? ALIASES[normalizeKey(decoded)] ?? null;
  }

  return null;
}
