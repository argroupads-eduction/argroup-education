import indexData from '@/data/college-image-index.json';
import { isJunkCollegeImage } from '@/lib/collegeImageQuality';
import { resolveWpMediaUrl } from '@/lib/wpMediaUrl';

const BY_SLUG = indexData.bySlug as Record<string, string>;
const INDEX_KEYS = Object.keys(BY_SLUG);

/** Drop filler tokens so "sciences-and-research" ≈ "sciences-research". */
function compactSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/\b(and|the|of|for|in|at)\b/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveIndexedHit(key: string): string | null {
  const hit = BY_SLUG[key];
  if (!hit || isJunkCollegeImage(hit, key)) return null;
  return resolveWpMediaUrl(hit);
}

/** Exact key, stopword-compact match, then longest prefix/extension match. */
function findIndexKey(slug: string): string | null {
  const key = slug.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!key) return null;
  if (BY_SLUG[key]) return key;

  const compact = compactSlug(key);
  if (compact.length >= 12) {
    for (const k of INDEX_KEYS) {
      if (compactSlug(k) === compact) return k;
    }
  }

  // Partial / token overlap for hub titles that omit campus suffixes or add acronyms.
  if (compact.length >= 16) {
    let best: { key: string; score: number } | null = null;
    const qTokens = new Set(compact.split('-').filter((t) => t.length > 2));
    if (qTokens.size >= 3) {
      for (const k of INDEX_KEYS) {
        const kc = compactSlug(k);
        const kTokens = kc.split('-').filter((t) => t.length > 2);
        if (kTokens.length < 3) continue;
        const hits = kTokens.filter((t) => qTokens.has(t)).length;
        const score = hits / Math.max(qTokens.size, kTokens.length);
        if (hits >= 3 && score >= 0.55 && (!best || score > best.score || (score === best.score && k.length > best.key.length))) {
          best = { key: k, score };
        }
      }
      if (best) return best.key;
    }
  }

  // Partial titles on hub pages: "maharishi-markandeshwar-medical-college" → …-ambala / …-solan
  if (key.length < 16) return null;
  const candidates = INDEX_KEYS.filter((k) => k.startsWith(`${key}-`) || key.startsWith(`${k}-`));
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0] ?? null;
}

export function getCollegeImageBySlug(slug: string | null | undefined): string | null {
  if (!slug?.trim()) return null;
  const matched = findIndexKey(slug);
  if (!matched) return null;
  return resolveIndexedHit(matched);
}

/** Stable key for hub-only colleges (no dedicated WP page slug). */
export function collegeNameImageKey(name: string | null | undefined): string | null {
  if (!name?.trim()) return null;
  const key = name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return key || null;
}

export function resolveCollegeImageUrl(
  slug: string | null | undefined,
  fallbackUrl: string | null | undefined,
  collegeName?: string | null
): string | null {
  const slugCandidates = [
    slug?.trim() || null,
    collegeName ? collegeNameImageKey(collegeName) : null,
  ].filter((s, i, arr): s is string => Boolean(s) && arr.indexOf(s) === i);

  for (const key of slugCandidates) {
    const fromIndex = getCollegeImageBySlug(key);
    if (fromIndex) return fromIndex;
  }

  for (const key of slugCandidates) {
    if (!fallbackUrl || isJunkCollegeImage(fallbackUrl, key)) continue;
    const resolved = resolveWpMediaUrl(fallbackUrl);
    if (resolved) return resolved;
  }

  return null;
}
