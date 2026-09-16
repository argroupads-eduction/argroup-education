/** Latest Updates flyout — matches legacy WP menu (MBBS, BAMS, NEET, Blog, Delhi NCR). */

export type LatestUpdatesNavItem = {
  label: string;
  href: string;
  children?: readonly { label: string; href: string }[];
};

export const LATEST_UPDATES_NAV_ITEMS: readonly LatestUpdatesNavItem[] = [
  { label: 'Blog', href: '/blog' },
  { label: 'MBBS', href: '/mbbs' },
  { label: 'BAMS in India', href: '/bams-in-india' },
  {
    label: 'NEET',
    href: '/neet-ug-counselling',
    children: [
      {
        label: 'NEET 2026 Syllabus PDF – Subject Wise Breakdown',
        href: '/neet-2026-syllabus',
      },
      { label: 'NEET Rank Predictor', href: '/neet-rank-predictor' },
      { label: 'College Predictor', href: '/college-predictor' },
      { label: 'NEET UG Counselling', href: '/neet-ug-counselling' },
      { label: 'NEET PG Counselling', href: '/neet-pg-counselling' },
    ],
  },
  {
    label: 'Education consultancy in Delhi NCR',
    href: '/education-consultancy-in-delhi-ncr',
  },
] as const;

export const LATEST_UPDATES_NAV = {
  label: 'Latest Updates',
  href: '/mbbs',
  navMenu: 'latest-updates' as const,
  submenu: LATEST_UPDATES_NAV_ITEMS,
};
