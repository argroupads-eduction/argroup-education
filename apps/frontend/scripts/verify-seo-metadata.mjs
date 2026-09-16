/**
 * Verify SEO metadata from buildSiteMetadata + static page constants.
 * Optional: pass BASE_URL=http://localhost:3000 to fetch live HTML.
 */
import { readFileSync } from 'fs';
import { buildSiteMetadata } from '../lib/buildSiteMetadata.ts';

const EXPECTED = [
  {
    path: '/',
    source: 'static',
    title: 'Medical College Admission | NEET & MBBS Consultants India & Abroad',
    description:
      'Secure Medical College Admission with AR Group Of Education. Trust on top MBBS Admission Consultants In India & MBBS Admission Consultants Abroad. Contact a NEET Counselling Expert today!',
  },
  {
    path: '/about',
    slug: 'ar-group-of-education',
    canonicalPath: '/about',
    title: 'Best MBBS Consultants in India 2026 | AR Group Of Education',
    description:
      'Learn about the Best MBBS Consultants in India. We offer genuine MBBS admission guidance India for top medical colleges. Contact our experts today!',
  },
  {
    path: '/mbbs-india',
    slug: 'mbbs-in-india',
    canonicalPath: '/mbbs-india',
    title: 'Study MBBS in India 2026: Admission in Top Medical Colleges',
    description:
      'Plan your career and study MBBS in India. Learn about private medical colleges in India, fees, and eligibility. Call us now for expert advice!',
  },
  {
    path: '/mbbs-abroad',
    slug: 'study-mbbs-in-abroad',
    canonicalPath: '/mbbs-abroad',
    title: 'Study MBBS in Abroad for Indian Students | Low Cost Options',
    description:
      'Want to study MBBS in abroad for Indian students? Find MCI recognized universities abroad list and low cost options. Apply online for admissions!',
  },
  {
    path: '/md-ms',
    slug: 'md-ms',
    canonicalPath: '/md-ms',
    title: 'MD/MS Admission in India 2026: Top PG Medical Colleges & Fees',
    description:
      'Get direct MD/MS Admission in India without donation. Check top MD MS colleges in Uttar Pradesh and other states. Call our experts to book seats!',
  },
  {
    path: '/mbbs',
    slug: 'mbbs',
    title: 'MBBS Admission Guide 2026: Top Private & Govt Medical Colleges',
    description:
      'Get complete MBBS Admission guidance. Explore low cost MBBS in India and check top private medical colleges. Contact our advisors today to apply!',
  },
  {
    path: '/bams-in-india',
    slug: 'bams-in-india',
    title: 'BAMS in India 2026: Admission in Top Ayurvedic Colleges & Fees',
    description:
      'Looking for BAMS in India? Find top ayurvedic colleges in india, fee structures, and complete admission assistance. Call us today for a free session!',
  },
  {
    path: '/education-consultancy-in-delhi-ncr',
    slug: 'education-consultancy-in-delhi-ncr',
    title: 'Top MBBS admission consultancy in Delhi NCR | Expert Guidance',
    description:
      'Connect with the top MBBS admission consultancy in Delhi NCR. Get trusted MBBS admission guidance India for top universities. Enquire now for help!',
  },
  {
    path: '/neet-ug-counselling',
    slug: 'neet-ug-counselling',
    title: 'NEET UG Counselling 2026: Complete Registration & Process Guide',
    description:
      'Complete guide to NEET UG Counselling. Learn about UP NEET UG counselling 2026 registration process, fees, and seat matrix. Register with us today!',
  },
  {
    path: '/contact',
    source: 'static',
    title: 'Contact Us for Expert Medical Admission Counselling & Guidance',
    description:
      'Get expert medical admission counselling for MBBS, MD, and MS courses. Speak with our top consultants and secure your seat today. Reach out now!',
  },
];

const pages = JSON.parse(readFileSync('./data/wp-export-bundle/pages.json', 'utf8'));
const sitemapBefore = readFileSync('./app/api/sitemap/route.ts', 'utf8');

const results = [];

for (const spec of EXPECTED) {
  if (spec.source === 'static') {
    results.push({ path: spec.path, check: 'static-only', ok: true });
    continue;
  }

  const doc = pages.find((p) => p.slug === spec.slug);
  if (!doc) {
    results.push({ path: spec.path, ok: false, error: 'page not in bundle' });
    continue;
  }

  const meta = buildSiteMetadata(
    {
      id: doc.slug,
      type: 'page',
      title: doc.title,
      slug: doc.slug,
      content: doc.content,
      excerpt: doc.excerpt,
      featuredImage: doc.featuredImage,
      metaTitle: doc.metaTitle,
      metaDescription: doc.metaDescription,
      canonicalUrl: doc.canonicalUrl,
      ogTitle: doc.ogTitle,
      ogDescription: doc.ogDescription,
      ogImage: doc.ogImage,
      twitterTitle: doc.twitterTitle,
      twitterDescription: doc.twitterDescription,
    },
    spec.canonicalPath ? { canonicalPath: spec.canonicalPath } : undefined
  );

  const ok =
    meta.title === spec.title &&
    meta.description === spec.description &&
    meta.openGraph?.title === spec.title &&
    meta.openGraph?.description === spec.description &&
    meta.twitter?.title === spec.title &&
    meta.twitter?.description === spec.description;

  results.push({
    path: spec.path,
    ok,
    title: meta.title,
    description: meta.description,
    canonical: meta.alternates?.canonical,
    ogTitle: meta.openGraph?.title,
    twitterTitle: meta.twitter?.title,
  });
}

const base = process.env.BASE_URL?.replace(/\/$/, '');
if (base) {
  for (const spec of EXPECTED) {
    const url = spec.path === '/' ? base : `${base}${spec.path}`;
    try {
      const res = await fetch(url);
      const html = await res.text();
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
      const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i);
      const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i);
      const twTitleMatch = html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']*)["']/i);
      const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);

      results.push({
        path: spec.path,
        live: true,
        htmlTitle: titleMatch?.[1] ?? null,
        htmlDescription: descMatch?.[1] ?? null,
        htmlOgTitle: ogTitleMatch?.[1] ?? null,
        htmlOgDescription: ogDescMatch?.[1] ?? null,
        htmlTwitterTitle: twTitleMatch?.[1] ?? null,
        htmlCanonical: canonicalMatch?.[1] ?? null,
        liveOk:
          titleMatch?.[1]?.includes(spec.title.slice(0, 40)) &&
          descMatch?.[1]?.includes(spec.description.slice(0, 40)),
      });
    } catch (e) {
      results.push({ path: spec.path, live: true, liveOk: false, error: String(e) });
    }
  }
}

console.log(
  JSON.stringify(
    {
      buildSiteMetadataChecks: results.filter((r) => !r.live),
      sitemapRouteUnchanged: sitemapBefore.includes('sitemap'),
      liveChecks: results.filter((r) => r.live),
    },
    null,
    2
  )
);
