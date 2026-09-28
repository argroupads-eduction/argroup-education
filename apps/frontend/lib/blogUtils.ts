import type { BlogListItem } from '@/lib/contentApi';
import { metaDescriptionFromContent } from '@/lib/wpHtmlPrepare';

/**
 * Blogs fully removed from the public site (listing, sitemap, and /blog/… URLs).
 * Keep in sync with editorial takedowns — direct URLs return 404.
 */
export const BLOG_REMOVED_PUBLIC_SLUGS = new Set([
  'big-update-neet-aspirants-2026',
  'bukhara-state-medical-institute-eligibility',
  'cheapest-mbbs-colleges-in-the-world',
  'deemed-universities-in-india-for-mbbs',
  'do-or-die-chapters-for-neet-2026',
  'mbbs-abroad-read-this',
  'mbbs-admission-through-nri-quota-india',
  'mbbs-admission-through-state-quota',
  'medical-college-reality-check-india',
  'neet-2026-answer-key',
  'neet-2026-expected-difficulty-level',
  'neet-2026-result-date-and-time',
  'neet-dress-code-2026',
  'neet-ug-counselling-2026-step-by-step-process',
  'nta-cancelled-neet-ug-2026-exam',
  'state-wise-neet-pg-medical-seats-in-india',
  'top-medical-universities-in-philippines',
  'what-to-do-after-neet-exam-2026',
]);

/** Short / legacy blog slugs → canonical published slug. */
export const BLOG_SLUG_CANONICAL: Record<string, string> = {
  'neet-re-exam-2026-vs-original-exam':
    'neet-re-exam-2026-vs-original-exam-which-is-tougher',
  'top-medical-colleges-india': 'top-medical-colleges-in-india',
  // Blog CMS slug is `mbbs-in-russia` (page hub is `/mbbs-in-russia`, blog is `/blog/mbbs-in-russia`).
  'how-much-neet-score-is-required-for-mbbs-in-russia-complete-guide-2026':
    'mbbs-in-russia',
  'can-i-get-mbbs-with-250-marks-in-neet-complete-admission-guide-2026':
    'can-i-get-mbbs-with-250-marks-in-neet',
  'NEET PG Exam 2026': 'neet-pg-exam-2026',
  'mata-gujri-memorial-medical-college,kishanganj':
    'mata-gujri-memorial-medical-college-kishanganj',
  'neet-marks-for-mbbs-private-mbbs': 'neet-marks-for-private-mbbs',
  // CMS renamed slug; keep old URLs pointing at the live post.
  'neet-counselling-2026-choices-filling-10-times': 'neet-ug-counselling-choice-filling',
  // Blog Meta Changes sheet (Google Doc) — old URLs → new SEO slugs.
  'how-to-get-mbbs-with-a-low-neet-score-in-2026': 'mbbs-with-low-neet-score-2026',
  'mbbs-admission-2026-without-donation': 'mbbs-admission-without-donation-2026',
  'marks-are-required-in-neet-for-mbbs': 'marks-required-in-neet-for-mbbs-2026',
  'mbbs-with-300-marks-in-neet': 'mbbs-with-300-marks-in-neet-2026',
  '400-marks-in-neet-rank': '400-marks-in-neet-2026',
  'score-is-needed-in-neet': 'score-needed-in-neet-2026',
  'neet-paper-analysis': 'neet-2026-paper-analysis',
};

/** Hide takedowns + old slugs that already have a canonical URL. Unique live posts stay on /blog. */
export const BLOG_EXCLUDED_LIST_SLUGS = new Set([
  ...BLOG_REMOVED_PUBLIC_SLUGS,
  ...Object.keys(BLOG_SLUG_CANONICAL),
]);


function normalizeBlogTitleKey(title: string): string {
  return title
    .replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '')
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function pickBetterBlogPost(a: BlogListItem, b: BlogListItem): BlogListItem {
  if (BLOG_EXCLUDED_LIST_SLUGS.has(a.slug)) return b;
  if (BLOG_EXCLUDED_LIST_SLUGS.has(b.slug)) return a;
  const aIsLegacy = a.slug in BLOG_SLUG_CANONICAL;
  const bIsLegacy = b.slug in BLOG_SLUG_CANONICAL;
  if (aIsLegacy && !bIsLegacy) return b;
  if (bIsLegacy && !aIsLegacy) return a;
  if (a.featuredImage && !b.featuredImage) return a;
  if (b.featuredImage && !a.featuredImage) return b;
  if (a.slug.length !== b.slug.length) return a.slug.length < b.slug.length ? a : b;
  return new Date(b.publishedAt).getTime() >= new Date(a.publishedAt).getTime() ? b : a;
}

/** Drop known duplicate slugs and collapse same-title CMS re-imports. */
export function dedupeBlogPosts(posts: BlogListItem[]): BlogListItem[] {
  const withoutExcluded = posts.filter((p) => !BLOG_EXCLUDED_LIST_SLUGS.has(p.slug));
  const byTitle = new Map<string, BlogListItem>();

  for (const post of withoutExcluded) {
    const key = normalizeBlogTitleKey(post.title);
    const prev = byTitle.get(key);
    byTitle.set(key, prev ? pickBetterBlogPost(prev, post) : post);
  }

  return [...byTitle.values()];
}

/** Newest first — featured slot uses index 0. */
export function sortBlogPostsByNewest<T extends { publishedAt: string }>(posts: T[]): T[] {
  return [...posts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/** Plain-text excerpt for cards (no raw `<p>` tags). */
export function blogCardExcerpt(
  excerpt: string | null | undefined,
  content?: string,
  max = 140
): string {
  const raw = metaDescriptionFromContent(excerpt, content ?? '', max);
  return raw
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** Deterministic UTC date label — avoids Node vs browser locale hydration mismatches. */
export function formatBlogDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  } catch {
    return '';
  }
}

export function readingTimeMinutes(html: string): number {
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Public URL for a blog post (supports nested WP slugs like `neet/doctor`). */
export function blogPostPath(slug: string): string {
  const parts = slug.split('/').filter(Boolean).map((s) => encodeURIComponent(s));
  return `/blog/${parts.join('/')}`;
}

/** DB / API slug from `[...slug]` route segments. */
export function slugFromBlogRouteSegments(segments: string[]): string {
  return segments.map((s) => decodeURIComponent(s)).join('/');
}
