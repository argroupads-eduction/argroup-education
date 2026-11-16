/** WordPress hub page slugs + SEO defaults for program index routes. */
export const PROGRAM_HUB_WP_SLUG = {
  india: 'mbbs-in-india',
  abroad: 'study-mbbs-in-abroad',
  mdms: 'md-ms',
} as const;

export type ProgramHubTheme = 'india' | 'abroad' | 'mdms';

export const PROGRAM_HUB_SEO = {
  india: {
    title: 'Study MBBS in India | MBBS Admission in India',
    description:
      'Secure your seat to study MBBS in India. Get expert counseling and direct guidance for MBBS Admission in India across top medical colleges. Contact us today!',
    keywords: ['Study MBBS in India', 'MBBS Admission in India'] as const,
    path: '/mbbs-india',
    badge: 'MBBS in India',
  },
  abroad: {
    title: 'Study MBBS Abroad | Trusted MBBS Abroad Consultants',
    description:
      'Want to Study MBBS Abroad? Connect with trusted MBBS Abroad Consultants to explore NMC-approved medical universities with transparent fees. Apply now!',
    keywords: ['Study MBBS Abroad', 'MBBS Abroad Consultants'] as const,
    path: '/mbbs-abroad',
    badge: 'MBBS Abroad',
  },
  mdms: {
    title: 'MD MS Admission in India | AR Group of Education',
    description:
      'Get guidance on MD MS admission in India. Understand NEET PG counselling, college options, fees and documents for clinical and non-clinical branches.',
    keywords: ['MD MS Admission in India', 'NEET PG counselling'] as const,
    path: '/md-ms',
    badge: 'MD / MS',
  },
} as const;
