/** WordPress hub page slugs + SEO defaults for program index routes. */
export const PROGRAM_HUB_WP_SLUG = {
  india: 'mbbs-in-india',
  abroad: 'study-mbbs-in-abroad',
  mdms: 'md-ms',
} as const;

export type ProgramHubTheme = 'india' | 'abroad' | 'mdms';

export const PROGRAM_HUB_SEO = {
  india: {
    title: 'MBBS in India — State-wise Colleges, Fees & NEET Counselling',
    description:
      'Explore MBBS in India across all states. Compare medical colleges, fees, NEET cut-offs, eligibility & get free admission counselling from AR Group of Education.',
    path: '/mbbs-india',
    badge: 'MBBS in India',
  },
  abroad: {
    title: 'MBBS Abroad — WHO-listed Universities & Admission Guide',
    description:
      'Study MBBS abroad in Russia, Nepal, Bangladesh, Kazakhstan & more. Compare fees, eligibility, visa process & get expert counselling.',
    path: '/mbbs-abroad',
    badge: 'MBBS Abroad',
  },
  mdms: {
    title: 'MD/MS Admission in India — State-wise PG Medical Counselling',
    description:
      'MD/MS admission guidance across top Indian states. Counselling support, seat matrix insights & college selection from AR Group of Education.',
    path: '/md-ms',
    badge: 'MD / MS',
  },
} as const;
