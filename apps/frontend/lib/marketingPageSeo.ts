import type { SiteContent } from '@/lib/contentApi';

type MarketingSeoEntry = {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  keywords: [string, string];
};

/** Curated SEO for key marketing routes (WP slug → meta). Overrides API/Neon until CMS is edited. */
export const MARKETING_PAGE_SEO: Record<string, MarketingSeoEntry> = {
  'ar-group-of-education': {
    focusKeyword: 'Medical Admission Consultants in India',
    keywords: ['Medical Admission Consultants in India', 'Best MBBS Consultants in India'],
    metaTitle: 'Best MBBS And Medical Admission Consultants in India',
    metaDescription:
      'Find the Best MBBS Consultants in India. As premier Medical Admission Consultants in India, we provide expert guidance for top medical colleges. Apply now!',
  },
  'mbbs-in-india': {
    focusKeyword: 'Study MBBS in India',
    keywords: ['Study MBBS in India', 'MBBS Admission in India'],
    metaTitle: 'Study MBBS in India | MBBS Admission in India',
    metaDescription:
      'Secure your seat to study MBBS in India. Get expert counseling and direct guidance for MBBS Admission in India across top medical colleges. Contact us today!',
  },
  'study-mbbs-in-abroad': {
    focusKeyword: 'Study MBBS Abroad',
    keywords: ['Study MBBS Abroad', 'MBBS Abroad Consultants'],
    metaTitle: 'Study MBBS Abroad | Trusted MBBS Abroad Consultants',
    metaDescription:
      'Want to Study MBBS Abroad? Connect with trusted MBBS Abroad Consultants to explore NMC-approved medical universities with transparent fees. Apply now!',
  },
  'md-ms': {
    focusKeyword: 'MD MS Admission in India',
    keywords: ['MD MS Admission in India', 'PG Medical Admission Counseling'],
    metaTitle: 'MD MS Admission in India | PG Medical Admission Counseling',
    metaDescription:
      'Secure your seat via MD MS Admission in India. Get expert PG Medical Admission Counseling for top clinical and non-clinical branches. Contact us today!',
  },
  mbbs: {
    focusKeyword: 'MBBS Admission Guidance',
    keywords: ['MBBS Admission Guidance', 'Top Medical Colleges for MBBS'],
    metaTitle: 'MBBS Admission Guidance | Top Medical Colleges for MBBS',
    metaDescription:
      'Get expert MBBS Admission Guidance to secure your seat. Explore Top Medical Colleges for MBBS in India and abroad with transparent fee structures. Apply now!',
  },
  'bams-in-india': {
    focusKeyword: 'BAMS Admission in India',
    keywords: ['BAMS Admission in India', 'Top BAMS Colleges in India'],
    metaTitle: 'BAMS Admission in India | Top BAMS Colleges in India',
    metaDescription:
      'Get expert guidance for BAMS Admission in India. Explore the Top BAMS Colleges in India, check transparent fee structures, and secure your seat. Apply now!',
  },
  'education-consultancy-in-delhi-ncr': {
    focusKeyword: 'Education Consultants in Delhi NCR',
    keywords: ['Education Consultants in Delhi NCR', 'Admission Consultancy in Delhi'],
    metaTitle: 'Education Consultants Delhi NCR | Admission Consultancy Delhi',
    metaDescription:
      'Connect with the top education consultants in Delhi NCR. Get expert admission consultancy in Delhi for direct guidance into medical and professional courses.',
  },
  'neet-ug-counselling': {
    focusKeyword: 'NEET UG Counselling',
    keywords: ['NEET UG Counselling', 'Medical Admission Counselling In India'],
    metaTitle: 'NEET UG Counselling | Medical Admission Counselling In India',
    metaDescription:
      'Navigate your NEET UG Counselling with expert ease. Secure seats in top colleges via our personalized Medical Admission Counselling in India. Register today!',
  },
  'neet-2026-syllabus': {
    focusKeyword: 'NEET 2026 Syllabus',
    keywords: ['NEET 2026 Syllabus', 'NEET UG Syllabus 2026'],
    metaTitle: 'NEET 2026 Syllabus | Latest NEET UG Syllabus 2026 PDF',
    metaDescription:
      'Download the latest official NEET 2026 Syllabus PDF. Check the complete chapter-wise weightage and NMC-notified topics for Physics, Chemistry, and Biology.',
  },
  'neet-rank-predictor': {
    focusKeyword: 'NEET Rank Predictor 2026',
    keywords: ['NEET Rank Predictor 2026', 'NEET Marks vs Rank 2026'],
    metaTitle: 'NEET Rank Predictor 2026 | NEET Marks vs Rank 2026',
    metaDescription:
      'Predict your rank with our accurate NEET Rank Predictor 2026. Check the latest NEET Marks vs Rank trends to evaluate your MBBS college options instantly.',
  },
  'neet-pg-counselling': {
    focusKeyword: 'NEET PG Counselling',
    keywords: ['NEET PG Counselling', 'NEET PG Seat Allotment'],
    metaTitle: 'NEET PG Counselling | NEET PG Seat Allotment Updates',
    metaDescription:
      'Get the latest updates on NEET PG Counselling and seat allotment. Access expert choice-filling strategies, seat matrices, and cutoffs for MD/MS/DNB seats.',
  },
};

export function applyMarketingPageSeo(content: SiteContent): SiteContent {
  const seo = MARKETING_PAGE_SEO[content.slug];
  if (!seo) return content;

  return {
    ...content,
    metaTitle: seo.metaTitle,
    metaDescription: seo.metaDescription,
    focusKeyword: seo.focusKeyword,
    keywords: [...seo.keywords],
    ogTitle: seo.metaTitle,
    ogDescription: seo.metaDescription,
    twitterTitle: seo.metaTitle,
    twitterDescription: seo.metaDescription,
  };
}
