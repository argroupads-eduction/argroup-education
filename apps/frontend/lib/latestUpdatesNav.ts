/** Latest Updates flyout. */

export type LatestUpdatesNavItem = {
  label: string;
  href: string;
  children?: readonly { label: string; href: string }[];
};

export const LATEST_UPDATES_NAV_ITEMS: readonly LatestUpdatesNavItem[] = [
  { label: 'Blog', href: '/blog' },
  { label: 'BAMS', href: '/bams-in-india' },
  {
    label: 'NEET',
    href: '/neet-ug-counselling',
    children: [
      { label: 'NEET Rank Predictor', href: '/neet-rank-predictor' },
      { label: 'College Predictor', href: '/college-predictor' },
      { label: 'NEET UG Counselling', href: '/neet-ug-counselling' },
      { label: 'NEET PG Counselling', href: '/neet-pg-counselling' },
    ],
  },
] as const;

export const LATEST_UPDATES_NAV = {
  label: 'Latest Updates',
  href: '/mbbs',
  navMenu: 'latest-updates' as const,
  submenu: LATEST_UPDATES_NAV_ITEMS,
};
