/**
 * One-off SEO metadata update for marketing pages (pages.json only).
 * Run: node scripts/update-seo-metadata.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

const PAGES_PATH = './data/wp-export-bundle/pages.json';

/** URL path → WP slug in pages.json */
const UPDATES = [
  {
    path: '/about',
    slug: 'ar-group-of-education',
    metaTitle: 'Best MBBS Consultants in India 2026 | AR Group Of Education',
    metaDescription:
      'Learn about the Best MBBS Consultants in India. We offer genuine MBBS admission guidance India for top medical colleges. Contact our experts today!',
  },
  {
    path: '/mbbs-india',
    slug: 'mbbs-in-india',
    metaTitle: 'Study MBBS in India 2026: Admission in Top Medical Colleges',
    metaDescription:
      'Plan your career and study MBBS in India. Learn about private medical colleges in India, fees, and eligibility. Call us now for expert advice!',
  },
  {
    path: '/mbbs-abroad',
    slug: 'study-mbbs-in-abroad',
    metaTitle: 'Study MBBS in Abroad for Indian Students | Low Cost Options',
    metaDescription:
      'Want to study MBBS in abroad for Indian students? Find MCI recognized universities abroad list and low cost options. Apply online for admissions!',
  },
  {
    path: '/md-ms',
    slug: 'md-ms',
    metaTitle: 'MD/MS Admission in India 2026: Top PG Medical Colleges & Fees',
    metaDescription:
      'Get direct MD/MS Admission in India without donation. Check top MD MS colleges in Uttar Pradesh and other states. Call our experts to book seats!',
  },
  {
    path: '/mbbs',
    slug: 'mbbs',
    metaTitle: 'MBBS Admission Guide 2026: Top Private & Govt Medical Colleges',
    metaDescription:
      'Get complete MBBS Admission guidance. Explore low cost MBBS in India and check top private medical colleges. Contact our advisors today to apply!',
  },
  {
    path: '/bams-in-india',
    slug: 'bams-in-india',
    metaTitle: 'BAMS in India 2026: Admission in Top Ayurvedic Colleges & Fees',
    metaDescription:
      'Looking for BAMS in India? Find top ayurvedic colleges in india, fee structures, and complete admission assistance. Call us today for a free session!',
  },
  {
    path: '/education-consultancy-in-delhi-ncr',
    slug: 'education-consultancy-in-delhi-ncr',
    metaTitle: 'Top MBBS admission consultancy in Delhi NCR | Expert Guidance',
    metaDescription:
      'Connect with the top MBBS admission consultancy in Delhi NCR. Get trusted MBBS admission guidance India for top universities. Enquire now for help!',
  },
  {
    path: '/neet-ug-counselling',
    slug: 'neet-ug-counselling',
    metaTitle: 'NEET UG Counselling 2026: Complete Registration & Process Guide',
    metaDescription:
      'Complete guide to NEET UG Counselling. Learn about UP NEET UG counselling 2026 registration process, fees, and seat matrix. Register with us today!',
  },
];

const pages = JSON.parse(readFileSync(PAGES_PATH, 'utf8'));
const report = [];

for (const spec of UPDATES) {
  const idx = pages.findIndex((p) => p.slug === spec.slug);
  if (idx < 0) {
    report.push({ path: spec.path, slug: spec.slug, status: 'NOT_FOUND' });
    continue;
  }
  const page = pages[idx];
  const before = {
    metaTitle: page.metaTitle ?? null,
    metaDescription: page.metaDescription ?? null,
    canonicalUrl: page.canonicalUrl ?? null,
  };

  page.metaTitle = spec.metaTitle;
  page.metaDescription = spec.metaDescription;
  page.ogTitle = spec.metaTitle;
  page.ogDescription = spec.metaDescription;
  page.twitterTitle = spec.metaTitle;
  page.twitterDescription = spec.metaDescription;

  report.push({
    path: spec.path,
    slug: spec.slug,
    status: 'UPDATED',
    before,
    after: {
      metaTitle: spec.metaTitle,
      metaDescription: spec.metaDescription,
      canonicalUrl: page.canonicalUrl ?? null,
    },
  });
}

writeFileSync(PAGES_PATH, JSON.stringify(pages, null, 2) + '\n');
writeFileSync('./data/wp-export-bundle/reports/seo-metadata-update.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
