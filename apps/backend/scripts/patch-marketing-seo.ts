/**
 * Patch SEO metadata for key marketing pages in Neon (SitePage).
 * Run from apps/backend: npx tsx scripts/patch-marketing-seo.ts
 */
import { PrismaClient } from '@prisma/client';

const UPDATES: Record<string, { metaTitle: string; metaDescription: string }> = {
  'ar-group-of-education': {
    metaTitle: 'Best MBBS Consultants in India 2026 | AR Group Of Education',
    metaDescription:
      'Learn about the Best MBBS Consultants in India. We offer genuine MBBS admission guidance India for top medical colleges. Contact our experts today!',
  },
  'mbbs-in-india': {
    metaTitle: 'Study MBBS in India 2026: Admission in Top Medical Colleges',
    metaDescription:
      'Plan your career and study MBBS in India. Learn about private medical colleges in India, fees, and eligibility. Call us now for expert advice!',
  },
  'study-mbbs-in-abroad': {
    metaTitle: 'Study MBBS in Abroad for Indian Students | Low Cost Options',
    metaDescription:
      'Want to study MBBS in abroad for Indian students? Find MCI recognized universities abroad list and low cost options. Apply online for admissions!',
  },
  'md-ms': {
    metaTitle: 'MD/MS Admission in India 2026: Top PG Medical Colleges & Fees',
    metaDescription:
      'Get direct MD/MS Admission in India without donation. Check top MD MS colleges in Uttar Pradesh and other states. Call our experts to book seats!',
  },
  mbbs: {
    metaTitle: 'MBBS Admission Guide 2026: Top Private & Govt Medical Colleges',
    metaDescription:
      'Get complete MBBS Admission guidance. Explore low cost MBBS in India and check top private medical colleges. Contact our advisors today to apply!',
  },
  'bams-in-india': {
    metaTitle: 'BAMS in India 2026: Admission in Top Ayurvedic Colleges & Fees',
    metaDescription:
      'Looking for BAMS in India? Find top ayurvedic colleges in india, fee structures, and complete admission assistance. Call us today for a free session!',
  },
  'education-consultancy-in-delhi-ncr': {
    metaTitle: 'Top MBBS admission consultancy in Delhi NCR | Expert Guidance',
    metaDescription:
      'Connect with the top MBBS admission consultancy in Delhi NCR. Get trusted MBBS admission guidance India for top universities. Enquire now for help!',
  },
  'neet-ug-counselling': {
    metaTitle: 'NEET UG Counselling 2026: Complete Registration & Process Guide',
    metaDescription:
      'Complete guide to NEET UG Counselling. Learn about UP NEET UG counselling 2026 registration process, fees, and seat matrix. Register with us today!',
  },
};

async function main() {
  const prisma = new PrismaClient();
  const report: unknown[] = [];

  for (const [slug, seo] of Object.entries(UPDATES)) {
    const existing = await prisma.sitePage.findFirst({ where: { slug } });
    if (!existing) {
      report.push({ slug, status: 'NOT_FOUND' });
      continue;
    }

    const before = {
      metaTitle: existing.metaTitle,
      metaDescription: existing.metaDescription,
      canonicalUrl: existing.canonicalUrl,
    };

    await prisma.sitePage.update({
      where: { id: existing.id },
      data: {
        metaTitle: seo.metaTitle,
        metaDescription: seo.metaDescription,
        ogTitle: seo.metaTitle,
        ogDescription: seo.metaDescription,
        twitterTitle: seo.metaTitle,
        twitterDescription: seo.metaDescription,
      },
    });

    report.push({ slug, status: 'UPDATED', before, after: seo });
  }

  console.log(JSON.stringify(report, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
