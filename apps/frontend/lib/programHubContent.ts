/** WordPress hub page slugs + SEO defaults for program index routes. */
export const PROGRAM_HUB_WP_SLUG = {
  india: 'mbbs-in-india',
  abroad: 'study-mbbs-in-abroad',
  mdms: 'md-ms',
} as const;

export type ProgramHubTheme = 'india' | 'abroad' | 'mdms';

export const PROGRAM_HUB_SEO = {
  india: {
    title: 'Study MBBS in India 2026: Admission in Top Medical Colleges',
    description:
      'Plan your career and study MBBS in India. Learn about private medical colleges in India, fees, and eligibility. Call us now for expert advice!',
    path: '/mbbs-india',
    badge: 'MBBS in India',
  },
  abroad: {
    title: 'Study MBBS in Abroad for Indian Students | Low Cost Options',
    description:
      'Want to study MBBS in abroad for Indian students? Find MCI recognized universities abroad list and low cost options. Apply online for admissions!',
    path: '/mbbs-abroad',
    badge: 'MBBS Abroad',
  },
  mdms: {
    title: 'MD/MS Admission in India 2026: Top PG Medical Colleges & Fees',
    description:
      'Get direct MD/MS Admission in India without donation. Check top MD MS colleges in Uttar Pradesh and other states. Call our experts to book seats!',
    path: '/md-ms',
    badge: 'MD / MS',
  },
} as const;
