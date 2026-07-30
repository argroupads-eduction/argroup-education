import { MBBS_ABROAD_COUNTRIES } from '@/lib/mbbsAbroadTree';
import { MBBS_INDIA_STATES } from '@/lib/mbbsIndiaTree';
import { MD_MS_NAV_ITEMS } from '@/lib/mdMsNav';
import { LATEST_UPDATES_NAV_ITEMS } from '@/lib/latestUpdatesNav';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/constants';

/** Google image sitemap (dynamic). */
export const IMAGE_SITEMAP_PATH = '/sitemap-images.xml';

/** Paths that must never be indexed (HTML pages / APIs — not public media). */
export const ROBOTS_DISALLOW_PREFIXES = [
  '/api/',
  '/admin/',
  '/private/',
  '/thank-you',
  '/_next/',
] as const;

/** Paths Google Image Search must always be allowed to crawl. */
export const ROBOTS_IMAGE_ALLOW_PREFIXES = [
  '/',
  '/wp-content/',
  '/uploads/',
  '/api/wp-media/',
  '/states/',
  '/mbbs-abroad-scroll/',
] as const;

/** High-demand marketing & counselling pages users search for. */
export const ROBOTS_ALLOW_PREFIXES = [
  '/',
  '/about',
  '/services',
  '/contact',
  '/mbbs-india',
  '/mbbs-abroad',
  '/md-ms',
  '/blog',
  '/countries',
  '/neet-rank-predictor',
  '/college-predictor',
  '/neet-ug-counselling',
  '/neet-pg-counselling',
  '/neet-2026-syllabus',
  '/mbbs',
  '/bams-in-india',
  '/education-consultancy-in-delhi-ncr',
  '/privacy',
  '/terms',
  '/disclaimer',
  '/sitemap',
] as const;

/** AI / LLM crawlers — allowed so ChatGPT, Perplexity, Claude, etc. can cite the site. */
export const LLM_CRAWLER_AGENTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'cohere-ai',
  'Bytespider',
  'meta-externalagent',
  'FacebookBot',
] as const;

export type SitemapEntry = {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: number;
};

function collectNavHrefs(
  items: readonly { href: string; children?: readonly { href: string }[] }[]
): string[] {
  const out: string[] = [];
  for (const item of items) {
    out.push(item.href);
    if (item.children) {
      for (const child of item.children) out.push(child.href);
    }
  }
  return out;
}

/** Static marketing paths for sitemap + llms.txt. */
export function getCoreMarketingPaths(): string[] {
  const latest = collectNavHrefs(LATEST_UPDATES_NAV_ITEMS);
  const mdMs = MD_MS_NAV_ITEMS.map((item) => item.href);
  return [...new Set([...ROBOTS_ALLOW_PREFIXES, ...latest, ...mdMs])];
}

export function getSupplementalSitemapEntries(baseUrl: string): SitemapEntry[] {
  const base = baseUrl.replace(/\/$/, '');
  const now = new Date().toISOString();
  const entries: SitemapEntry[] = [];

  const push = (path: string, priority: number, changefreq: string) => {
    const normalized = path === '/' ? base : `${base}${path.startsWith('/') ? path : `/${path}`}`;
    entries.push({ loc: normalized, lastmod: now, changefreq, priority });
  };

  for (const path of getCoreMarketingPaths()) {
    const priority =
      path === '/' ? 1 :
      path.startsWith('/mbbs-india') || path.startsWith('/mbbs-abroad') || path.startsWith('/md-ms') ? 0.9 :
      path.startsWith('/neet') ? 0.85 :
      0.75;
    push(path, priority, path === '/' ? 'daily' : 'weekly');
  }

  for (const state of MBBS_INDIA_STATES) {
    push(state.href, 0.88, 'weekly');
    for (const college of state.colleges) {
      if (college.slug) push(college.href, 0.72, 'monthly');
    }
  }

  for (const country of MBBS_ABROAD_COUNTRIES) {
    push(country.href, 0.88, 'weekly');
    for (const college of country.colleges ?? []) {
      if (college.slug) push(college.href, 0.72, 'monthly');
    }
    for (const university of country.universities ?? []) {
      push(university.href, 0.78, 'monthly');
      for (const college of university.colleges ?? []) {
        if (college.slug) push(college.href, 0.72, 'monthly');
      }
    }
  }

  return entries;
}

export function buildRobotsTxt(baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, '');
  const allowLines = [
    ...ROBOTS_ALLOW_PREFIXES.map((path) => (path === '/' ? 'Allow: /' : `Allow: ${path}`)),
    ...ROBOTS_IMAGE_ALLOW_PREFIXES.filter((p) => p !== '/').map((path) => `Allow: ${path}`),
  ];
  const disallowLines = ROBOTS_DISALLOW_PREFIXES.map((path) => `Disallow: ${path}`);

  const lines: string[] = [
    `# ${SITE_NAME}`,
    `# ${SITE_DESCRIPTION}`,
    `# ${base}`,
    '',
    'User-agent: *',
    ...allowLines,
    ...disallowLines,
    '',
    'User-agent: Googlebot',
    'Allow: /',
    ...ROBOTS_IMAGE_ALLOW_PREFIXES.filter((p) => p !== '/').map((path) => `Allow: ${path}`),
    ...disallowLines,
    '',
    'User-agent: Googlebot-Image',
    'Allow: /',
    ...ROBOTS_IMAGE_ALLOW_PREFIXES.filter((p) => p !== '/').map((path) => `Allow: ${path}`),
    'Disallow: /admin/',
    'Disallow: /private/',
    'Disallow: /thank-you',
    '',
    'User-agent: Bingbot',
    'Allow: /',
    ...disallowLines,
    '',
  ];

  for (const agent of LLM_CRAWLER_AGENTS) {
    lines.push(`User-agent: ${agent}`, 'Allow: /', ...disallowLines, '');
  }

  lines.push(
    `Sitemap: ${base}/sitemap.xml`,
    `Sitemap: ${base}${IMAGE_SITEMAP_PATH}`,
    `# LLM site guide (llms.txt): ${base}/llms.txt`,
  );

  return `${lines.join('\n')}\n`;
}

function llmsLink(base: string, path: string, label: string): string {
  const url = path === '/' ? base : `${base}${path}`;
  return `- [${label}](${url})`;
}

export function buildLlmsTxt(baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, '');
  const lines: string[] = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    'AR Group of Education (argroupofeducation.com) guides students for MBBS in India and abroad, NEET UG/PG counselling, college selection, documentation, visa assistance, and pre-departure support.',
    '',
    '## Main pages',
    llmsLink(base, '/', 'Home'),
    llmsLink(base, '/about', 'About AR Group of Education'),
    llmsLink(base, '/services', 'Admission & counselling services'),
    llmsLink(base, '/contact', 'Contact / free counselling'),
    '',
    '## MBBS India (state hubs)',
    llmsLink(base, '/mbbs-india', 'MBBS in India — all states'),
  ];

  for (const state of MBBS_INDIA_STATES) {
    lines.push(llmsLink(base, state.href, `MBBS in ${state.name}`));
  }

  lines.push('', '## MBBS Abroad (country hubs)', llmsLink(base, '/mbbs-abroad', 'MBBS abroad — all countries'));

  for (const country of MBBS_ABROAD_COUNTRIES) {
    lines.push(llmsLink(base, country.href, `MBBS in ${country.name}`));
  }

  lines.push('', '## MD/MS postgraduate', llmsLink(base, '/md-ms', 'MD/MS colleges in India'));
  for (const item of MD_MS_NAV_ITEMS) {
    lines.push(llmsLink(base, item.href, item.label));
  }

  lines.push('', '## NEET & popular tools');
  lines.push(llmsLink(base, '/neet-rank-predictor', 'NEET Rank Predictor'));
  for (const item of LATEST_UPDATES_NAV_ITEMS) {
    lines.push(llmsLink(base, item.href, item.label));
    if (item.children) {
      for (const child of item.children) {
        lines.push(llmsLink(base, child.href, child.label));
      }
    }
  }

  lines.push(
    '',
    '## Resources',
    llmsLink(base, '/blog', 'Blog — MBBS guides, fees, cutoffs, country comparisons'),
    llmsLink(base, '/countries', 'Study destinations overview'),
    '',
    '## Legal',
    llmsLink(base, '/privacy', 'Privacy policy'),
    llmsLink(base, '/terms', 'Terms & conditions'),
    llmsLink(base, '/disclaimer', 'Disclaimer'),
    '',
    '## Optional',
    `- [XML Sitemap](${base}/sitemap.xml) — full list of indexable URLs`,
    `- [HTML sitemap](${base}/sitemap) — human-readable site map`,
    '',
    '## Contact',
    '- Phone: +91-9667006402',
    '- Website: https://argroupofeducation.com',
    '- Services: MBBS India, MBBS Abroad (Russia, Kazakhstan, Nepal, Georgia, Kyrgyzstan, Uzbekistan, Bangladesh, etc.), NEET counselling, visa support',
  );

  return `${lines.join('\n')}\n`;
}
