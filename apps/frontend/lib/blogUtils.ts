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

/** Legacy duplicate slugs hidden from blog index (canonical slug kept). */
export const BLOG_EXCLUDED_LIST_SLUGS = new Set([
  ...BLOG_REMOVED_PUBLIC_SLUGS,
  '5-best-medical-colleges-in-india',
  'a-complete-guide-to-the-top-medical-colleges-in-uttarakhand-2024',
  'a-comprehensive-guide-for-indian-medical-aspirants-to-mbbs-in-india',
  'about-batumi-shota-rustaveli-state-university',
  'about-mbbs-in-russia-for-indian-students',
  'admission-in-sudha-medical',
  'admission-to-mbbs-in-india',
  'advantages-of-studying-mbbs-in-philippines',
  'advantages-of-studying-mbbs-in-russia',
  'apply-for-mbbs-abroad',
  'apply-mbbs-in-russia',
  'batumi-shota-rustaveli-state-university',
  'best-consultancy-for-mbbs-abroad',
  'best-countries-for-mbbs',
  'best-countries-for-mbbs-abroad',
  'best-countries-to-study-mbbs-abroad',
  'best-country-for-mbbs-for-indian-students',
  'best-mbbs-colleges-in-karnataka-for-a-promising-medical-career',
  'best-md-colleges-in-india',
  'best-md-colleges-in-india-2025',
  'best-medical-colleges-abroad-for-2024',
  'best-medical-colleges-in-rajasthan',
  'best-medical-universities-in-georgia-2024',
  'best-medical-universities-in-kazakhstan-unlock-the-gateway-to-a-rewarding-medical-career',
  'best-medical-universities-in-russia',
  'best-medical-university-in-georgia',
  'best-medical-university-in-russia-a-pathway-to-excellence-in-medical-education',
  'best-private-mbbs-colleges-in-uttar-pradesh-up-2026',
  'best-time-to-apply-for-mbbs-abroad-2026-intake',
  'bihar-neet-cutoff',
  'bukkhara-state-medical-institute-eligibility',
  'can-i-get-mbbs-with-250-marks-in-neet-complete-admission-guide-2026',
  'career-options-after-mbbs-in-india',
  'cat-2023-results-declared',
  'cheapest-mbbs-colleges-in-india-2024-25',
  'cheapest-mbbs-country',
  'conquering-the-neet-ug-2024-a-comprehensive-guide',
  'decoding-neet-2024-cutoff-marks-you-need-for-mbbs-admissions',
  'deemed-university-mbbs-admission-process-2026',
  'difference-between-bams-mbbs-and-bhms',
  'documents-required-for-neet-counselling',
  'dr-s-s-tantia-medical-college-in-sri-ganganagar-eligibility-admission-fees-and-facilities',
  'dream-becoming-a-doctor',
  'eligibility-criteria-for-neet-pg',
  'eligibility-for-mbbs-in-india',
  'everything-know-about-re-neet-2026',
  'everything-you-need-to-learn-about-neet-pg',
  'everything-you-should-know-about-neet-pg-counseling',
  'explore-jalalabad-state-medical-university-kyrgyzstan',
  'explore-mbbs-in-india-to-achieve-your-dream',
  'explore-top-5-countries-for-pursuing-mbbs-abroad',
  'exploring-medicine-in-georgia-your-ultimate-guide-to-eligibility-fees-and-top-colleges',
  'fmge-next-exam-after-mbbs-abroad-explained-2026',
  'from-neet-pg-to-next-exam',
  'georgia-is-the-best-option-for-pursuing-an-mbbs',
  'georgian-university',
  'hamdard-institute-colleges',
  'how-ai-is-streamlining-hospital-operations',
  'how-is-mbbs-in-philippines-for-indian-students',
  'how-much-neet-score-is-required-for-mbbs-in-russia-complete-guide-2026',
  'how-to-choose-pg-specialization-after-mbbs',
  'how-to-get-assured-admission-to-mbbs-in-philippines',
  'how-to-prepare-for-the-neet-pg',
  'how-to-secure-admission-to-top-md-ms-universities',
  'is-an-mbbs-from-abroad-recognized-in-india',
  'is-kyrgyzstan-a-good-choice-for-mbbs',
  'is-neet-essential-for-mbbs-in-another-country',
  'kazakh-national-medical-university-fees',
  'last-minute-preparation-tips-and-strategies-for-neet-pg',
  'lets-know-about-andijan-state-medical-institute',
  'lets-know-about-kazakh-national-medical-university-kazakhstan',
  'lets-know-about-lyceum-northwestern-university-philippines',
  'list-of-medical-colleges-in-bangladesh',
  'list-of-top-medical-colleges-in-chhattisgarh',
  'list-of-top-medical-colleges-in-haryana',
  'list-of-top-medical-colleges-in-india',
  'list-of-top-medical-universities-in-kazakhstan',
  'low-budget-mbbs',
  'low-budget-mbbs-colleges-in-karnataka',
  'low-cost-mbbs-education',
  'low-neet-score',
  'low-neet-score-2025',
  'madhya-pradesh-neet-pg-medical-seats-govt-and-private-colleges',
  'mastering-your-medical-career-a-comprehensive-guide-to-pursuing-postgraduate-specializations-after-mbbs',
  'mbbs-abroad-admission-in-2026-27-for-indian-students',
  'mbbs-abroad-admission-process-for-indian-students-2026',
  'mbbs-abroad-for-indian-students-fees',
  'mbbs-abroad-vs-india-which-is-better-in-2026',
  'mbbs-abroad-with-low-neet-score',
  'mbbs-abroad-without-neet-2024-top-countries-eligibility-advantages-fees',
  'mbbs-admission-abroad',
  'mbbs-admission-in-karnataka-2024-25',
  'mbbs-admission-in-top-medical-colleges-in-uttar-pradesh',
  'mbbs-degree-from-russia',
  'mbbs-education-abroad',
  'mbbs-education-overseas',
  'mbbs-fees-in-private-colleges-in-india-2026',
  'mbbs-fees-in-up',
  'mbbs-for-indian-students-abroad',
  'mbbs-in-bangladesh',
  'mbbs-in-bangladesh-reach-out-your-academic-goal',
  'mbbs-in-georgia-2024-a-safe-option-for-indian-students',
  'mbbs-in-georgia-a-guide-for-indian-students',
  'mbbs-in-georgia-is-worth-it',
  'mbbs-in-georgia-top-universities-fees-eligibility',
  'mbbs-in-india-versus-mbbs-abroad-for-indian-students',
  'mbbs-in-karnataka',
  'mbbs-in-kazakhstan-eligibility-fees-and-colleges',
  'mbbs-in-kazakhstan-for-indian-students-a-comprehensive-guide',
  'mbbs-in-kazan-federal-university',
  'mbbs-in-kursk-state-medical-university-dynamic-influential',
  'mbbs-in-kyrgyzstan-a-guide-to-affordable-medical-education-in-central-asia',
  'mbbs-in-nepal-for-indian-students',
  'mbbs-in-nepal-for-indian-students-a-gateway-to-medical-dreams',
  'mbbs-in-punjab',
  'mbbs-in-russia-admission',
  'mbbs-in-russia-eligibility-fees-and-colleges',
  'mbbs-in-russia-for-indian-students-2024-25',
  'mbbs-in-russia-with-low-neet-score',
  'mbbs-in-russia-without-neet',
  'mbbs-in-uzbekistan-duration',
  'mbbs-in-uzbekistan-fee-structure',
  'mbbs-kazakhstan-without-neet',
  'mbbs-seats',
  'mbbs-seats-in-india-total-2026',
  'mbbs-seats-in-russia',
  'mci-approved-mbbs-colleges-abroad',
  'md-colleges-in-maharashtra',
  'md-colleges-in-uttar-pradesh',
  'md-colleges-in-uttarakhand',
  'md-in-dermatology',
  'md-in-obstetrics-and-gynaecology-admission-eligibility-fees-and-top-colleges',
  'md-in-radiology-admission-eligibility-fees-and-top-colleges',
  'md-ms-colleges-in-haryana',
  'md-ms-colleges-in-madhya-pradesh',
  'medical-colleges-in-georgia',
  'medical-degree-in-russia',
  'medical-education-abroad',
  'medical-seats-in-india',
  'medical-universities-in-russia',
  'nc-medical-colleges-and-hospital',
  'ncr-institute-of-medical-sciences-meerut-fees-admission-2024-25',
  'neet-2024-breakthrough-in-neet-2024-exam-pattern',
  'neet-2024-exam-registration-now-open-apply-now',
  'neet-2024-exam-syllabus',
  'neet-2025-cut-off-for-mbbs',
  'neet-2026-admit-card',
  'neet-2026-exam-day-guidelines',
  'neet-admit-card-released-2024-a-milestone-for-medical-aspirants',
  'neet-application-form-closing-today',
  'neet-deleted-syllabus-2026',
  'neet-exam-registration-2024-step-by-step-guide-to-apply',
  'neet-pg-2024-registration',
  'neet-pg-admit-card-2024-to-be-out-today',
  'neet-pg-bfuhs-releases-admission-process-for-postgraduate-degree-diploma-courses-read-details-here',
  'neet-pg-counseling-registration',
  'neet-pg-counselling-2024',
  'neet-pg-counselling-schedule-2024',
  'neet-pg-exam',
  'neet-pg-exam-2024',
  'neet-pg-exam-timings-marking-scheme-and-things-to-carry',
  'neet-pg-result',
  'neet-pg-result-declared',
  'neet-pg-result-expected-to-release-soon',
  'neet-pg-scorecard',
  'neet-re-exam-2026-vs-original-exam',
  'neet-required-for-universidade-catolica-timorense',
  'neet-result-2025',
  'neet-ug-2023-registrations-update',
  'neet-ug-2024',
  'neet-ug-2024-result-out',
  'neet-ug-2024-sc-hearing',
  'neet-ug-answer-key-and-omr-response-sheets-are-now-available',
  'neet-ug-ayush-counselling-2024-schedule',
  'neet-ug-counseling1',
  'neet-ug-official-answer-key-2023-released',
  'neet-ug-registration-last-date',
  'neet-ug-result',
  'neet-ug-result-2025',
  'neet-ug-results',
  'neet-ug-scorecards-schedules-re-exam',
  'nepal-is-the-best-place-to-pursue-mbbs',
  'nmc-approved-medical-colleges-in-georgia',
  'nmc-approved-medical-colleges-in-kazakhstan',
  'nmc-regulations-for-transfer-of-indian-students-pursuing-mbbs-abroad',
  'nta-releases-neet-ug-exam-dates-for-manipur-candidates',
  'overall-neet-cutoff-2024',
  'overview-of-mbbs-in-kyrgyzstan-2024-25',
  'perfect-protocol-for-acquiring-mbbs-degree-abroad',
  'pg-courses-after-mbbs',
  'programs-for-md-ms-admission-in-india',
  'propel-your-mbbs-journey-by-pursuing-it-in-kazakhstan',
  'pursue-mbbs-in-russia-overall-package-in-one-option',
  'pursuing-mbbs-in-bangladesh-2024-an-affordable-and-rewarding-journey',
  'pursuing-mbbs-in-china-a-guide-for-aspiring-doctors',
  'reasons-to-choose-russia-for-pursuing-mbbs-in-2024',
  'reasons-to-study-mbbs-in-russia-in-2024',
  'russian-medical-university',
  'samarkand-state-medical-university-2024-25',
  'scope-of-mbbs-in-india',
  'shri-siddhi-vinayak-medical-college-fees',
  'six-things-to-consider-before-pursuing-an-mbbs-abroad',
  'specializations-to-consider-after-mbbs-abroad-in-2022',
  'state-quota-vs-all-india-quota-mbbs-admission-2026',
  'study-mbbs-abroad-for-indian-students',
  'study-mbbs-in-georgia-is-it-a-worthy-option',
  'study-mbbs-in-madhya-pradesh',
  'studying-mbbs-in-georgia',
  'studying-mbbs-in-russia',
  'test-timing',
  'the-best-guidance-for-mbbs-admission-2022',
  'the-ultimate-guide-to-choosing-the-best-medical-college',
  'things-to-know-about-ama-school-of-medicine-philippines',
  'top-10-medical-colleges-in-russia-for-indian-students',
  'top-20-medical-university-in-russia',
  'top-5-medical-universities-in-russia-for-indian-students',
  'top-6-cheapest-countries-for-mbbs-in-2026',
  'top-colleges-for-mbbs-in-india',
  'top-government-medical-colleges-in-india-2026',
  'top-md-ms-colleges-in-india',
  'top-md-ms-colleges-in-uttar-pradesh',
  'top-medical-colleges-for-pursue-an-mbbs-degree-in-nepal',
  'top-medical-colleges-in-up',
  'top-medical-colleges-in-west-bengal',
  'top-medical-universities',
  'top-medical-universities-in-russia-a-comprehensive-guide',
  'top-medical-university-for-indian-students-in-georgia',
  'top-medical-university-in-kazakhstan',
  'top-reasons-to-study-mbbs-in-kazakhstan-for-indian-students',
  'top-universities-in-russia-for-mbbs',
  'tula-state-medical-university-fees',
  'uncovering-facts-about-mbbs-in-madhya-pradesh',
  'up-neet-ug-counselling-for-the-second-round',
  'up-neet-ug-first-round-result',
  'uttar-pradesh-neet-pg-medical-seats-govt-private-and-deemed-colleges',
  'uttarakhand-ayush-counselling-2025',
  'what-you-should-know-about-mcc-neet-pg-counseling',
  'why-is-neet-essential-for-indian-students-interested-in-studying-medicine',
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
};

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

export function formatBlogDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
