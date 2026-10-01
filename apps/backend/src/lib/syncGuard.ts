/**
 * Marketing payload-sync guards (Phase 1.6).
 *
 * Richer-field keep rule:
 * - Empty/whitespace incoming NEVER replaces non-empty existing.
 * - content/excerpt richness = stripLen + tagCount*50 + htmlLen*0.1
 * - SEO/OG/Twitter/canonical/focusKeyword richness = trim length
 * - schemaJson richness = JSON.stringify length (stable key order not required; length proxy)
 * - Keep existing when richness(existing) > richness(incoming) * 1.15
 *   (incoming within ~15% or richer = treated as intentional edit)
 * - publishedAt: never overwrite on existing rows; on create prefer legacyPublishedAt
 * - images: empty never replaces; /uploads/ absolutized; other relative URLs rejected
 */

const RICHER_RATIO = 1.15;

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function tagCount(html: string): number {
  const m = html.match(/<[a-zA-Z][^>]*>/g);
  return m ? m.length : 0;
}

export function htmlRichness(value: string | null | undefined): number {
  const html = typeof value === 'string' ? value : '';
  if (!html.trim()) return 0;
  return stripHtml(html).length + tagCount(html) * 50 + html.length * 0.1;
}

export function textRichness(value: string | null | undefined): number {
  if (typeof value !== 'string') return 0;
  return value.trim().length;
}

/** Parse JSON strings so schema is never double-encoded into Prisma Json columns. */
export function normalizeSchemaJson(value: unknown): unknown | null {
  if (value == null) return null;
  if (typeof value === 'string') {
    const t = value.trim();
    if (!t || t === 'null') return null;
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  }
  if (typeof value === 'object') return value;
  return null;
}

export function schemaRichness(value: unknown): number {
  const norm = normalizeSchemaJson(value);
  if (norm == null) return 0;
  try {
    const s = JSON.stringify(norm);
    return s && s !== 'null' && s !== '{}' && s !== '[]' ? s.length : 0;
  } catch {
    return 0;
  }
}

/** Prefer non-empty; keep existing when clearly richer. */
export function pickRicherText(
  incoming: string | null | undefined,
  existing: string | null | undefined,
  kind: 'html' | 'text' = 'text'
): string | null {
  const inc = typeof incoming === 'string' ? incoming : '';
  const ex = typeof existing === 'string' ? existing : '';
  const incTrim = inc.trim();
  const exTrim = ex.trim();
  if (!incTrim && exTrim) return existing ?? null;
  if (incTrim && !exTrim) return incoming ?? null;
  if (!incTrim && !exTrim) return incTrim ? incoming ?? null : existing ?? null;

  const score = kind === 'html' ? htmlRichness : textRichness;
  const sInc = score(inc);
  const sEx = score(ex);
  if (sEx > sInc * RICHER_RATIO) return existing ?? null;
  return incoming ?? null;
}

export function pickRicherSchema(
  incoming: unknown,
  existing: unknown
): unknown | undefined {
  const inc = normalizeSchemaJson(incoming);
  const ex = normalizeSchemaJson(existing);
  const sInc = schemaRichness(inc);
  const sEx = schemaRichness(ex);
  if (sInc === 0 && sEx > 0) return ex;
  if (sEx > sInc * RICHER_RATIO) return ex;
  if (sInc === 0 && sEx === 0) return undefined;
  return inc ?? ex ?? undefined;
}

export type ImageResolveOptions = {
  publicUrl?: string | null;
  rejectRelativeToHosts?: string[];
};

export function resolveSyncImageUrl(
  raw: string | null | undefined,
  opts: ImageResolveOptions = {}
): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s) return null;

  if (/^https?:\/\//i.test(s)) return s;
  if (/^\/\//.test(s)) return `https:${s}`;

  const isUploads = s === '/uploads' || s.startsWith('/uploads/');
  if (isUploads) {
    const base = String(opts.publicUrl || '').replace(/\/$/, '');
    if (!base) return null; // refuse relative /uploads without PUBLIC_URL
    return `${base}${s.startsWith('/') ? s : `/${s}`}`;
  }

  // Bundled site heroes: keep as same-origin /images/... paths
  if (s.startsWith('/images/')) {
    return s.split('?')[0] || s;
  }

  // Relative non-uploads — reject for sync write
  if (s.startsWith('/') || !s.includes('://')) {
    return null;
  }
  return s;
}

export function pickFeaturedImage(
  incoming: string | null | undefined,
  existing: string | null | undefined,
  opts: ImageResolveOptions = {}
): string | null {
  const inc = resolveSyncImageUrl(incoming, opts);
  const ex =
    typeof existing === 'string' && existing.trim() ? existing.trim() : null;
  if (!inc && ex) return ex;
  if (inc && !ex) return inc;
  return inc || ex || null;
}

export function resolvePublishedAtForSync(opts: {
  isNew: boolean;
  existingPublishedAt: Date | null | undefined;
  incomingPublishedAt: string | null | undefined;
  legacyPublishedAt?: string | null | undefined;
  published: boolean;
}): Date | null {
  // Strapi `legacyPublishedAt` is the editorial date — always honor when set
  // (fixes wrong "today" dates on re-Publish of existing posts).
  if (opts.legacyPublishedAt) {
    const legacy = new Date(opts.legacyPublishedAt);
    if (!Number.isNaN(legacy.getTime())) return legacy;
  }

  if (!opts.isNew) {
    // Existing rows: keep prior publishedAt unless legacy override above
    return opts.existingPublishedAt ?? null;
  }
  if (opts.incomingPublishedAt) {
    const d = new Date(opts.incomingPublishedAt);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return opts.published ? new Date() : null;
}
