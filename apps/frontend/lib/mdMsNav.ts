/** MD/MS navigation entries — labels and hrefs match site menu / WP routes. */
export type MdMsNavItem = {
  id: string;
  label: string;
  href: string;
  shortLabel: string;
  wpSlug: string;
  /** State hub cover from WP featured image (argroupofeducation.com). */
  coverImage: string;
};

export const MD_MS_NAV_ITEMS: MdMsNavItem[] = [
  {
    id: 'up',
    label: 'MD/MS in UP',
    href: '/md-ms/up',
    shortLabel: 'UP',
    wpSlug: 'md-ms-colleges-in-uttar-pradesh',
    coverImage: '/images/md-ms/up.jpeg',
  },
  {
    id: 'karnataka',
    label: 'MD/MS in Karnataka',
    href: '/md-ms/karnataka',
    shortLabel: 'KA',
    wpSlug: 'md-ms-in-karnataka',
    coverImage: '/images/md-ms/karnataka.jpeg',
  },
  {
    id: 'haryana',
    label: 'MD/MS in Haryana',
    href: '/md-ms/haryana',
    shortLabel: 'HR',
    wpSlug: 'md-ms-in-haryana',
    coverImage: '/images/md-ms/haryana.jpeg',
  },
  {
    id: 'mp',
    label: 'MD/MS in Madhya Pradesh',
    href: '/md-ms/mp',
    shortLabel: 'MP',
    wpSlug: 'md-ms-in-madhya-pradesh',
    coverImage: '/images/md-ms/mp.jpeg',
  },
  {
    id: 'chhattisgarh',
    label: 'MD/MS in Chhattisgarh',
    href: '/md-ms/chhattisgarh',
    shortLabel: 'CG',
    wpSlug: 'md-ms-in-chhattisgarh',
    coverImage: '/images/md-ms/chhattisgarh.jpeg',
  },
  {
    id: 'rajasthan',
    label: 'MD/MS in Rajasthan',
    href: '/md-ms/rajasthan',
    shortLabel: 'RJ',
    wpSlug: 'md-ms-in-rajasthan',
    coverImage: '/images/md-ms/rajasthan.jpeg',
  },
  {
    id: 'maharashtra',
    label: 'MD/MS in Maharashtra',
    href: '/md-ms/maharashtra',
    shortLabel: 'MH',
    wpSlug: 'md-ms-in-maharashtra',
    coverImage: '/images/md-ms/maharashtra.jpeg',
  },
  {
    id: 'uttarakhand',
    label: 'MD/MS in Uttarakhand',
    href: '/md-ms/uttarakhand',
    shortLabel: 'UK',
    wpSlug: 'md-ms-in-uttarakhand',
    coverImage: '/images/md-ms/uttarakhand.jpeg',
  },
  {
    id: 'tamil-nadu',
    label: 'MD/MS in Tamil Nadu',
    href: '/md-ms/tamil-nadu',
    shortLabel: 'TN',
    wpSlug: 'md-ms-in-tamil-nadu',
    coverImage: '/images/md-ms/tamil-nadu.jpeg',
  },
];

export function getMdMsNavItemById(id: string): MdMsNavItem | undefined {
  return MD_MS_NAV_ITEMS.find((item) => item.id === id);
}
