/** MD/MS navigation entries — labels and hrefs match site menu / WP routes. */
export type MdMsNavItem = {
  id: string;
  label: string;
  href: string;
  shortLabel: string;
  wpSlug: string;
};

export const MD_MS_NAV_ITEMS: MdMsNavItem[] = [
  {
    id: 'up',
    label: 'MD/MS in UP',
    href: '/md-ms/up',
    shortLabel: 'UP',
    wpSlug: 'md-ms-colleges-in-uttar-pradesh',
  },
  {
    id: 'karnataka',
    label: 'MD/MS in Karnataka',
    href: '/md-ms/karnataka',
    shortLabel: 'KA',
    wpSlug: 'md-ms-in-karnataka',
  },
  {
    id: 'haryana',
    label: 'MD/MS in Haryana',
    href: '/md-ms/haryana',
    shortLabel: 'HR',
    wpSlug: 'md-ms-in-haryana',
  },
  {
    id: 'mp',
    label: 'MD/MS in Madhya Pradesh',
    href: '/md-ms/mp',
    shortLabel: 'MP',
    wpSlug: 'md-ms-in-madhya-pradesh',
  },
  {
    id: 'chhattisgarh',
    label: 'MD/MS in Chhattisgarh',
    href: '/md-ms/chhattisgarh',
    shortLabel: 'CG',
    wpSlug: 'md-ms-in-chhattisgarh',
  },
  {
    id: 'rajasthan',
    label: 'MD/MS in Rajasthan',
    href: '/md-ms/rajasthan',
    shortLabel: 'RJ',
    wpSlug: 'md-ms-in-rajasthan',
  },
  {
    id: 'maharashtra',
    label: 'MD/MS in Maharashtra',
    href: '/md-ms/maharashtra',
    shortLabel: 'MH',
    wpSlug: 'md-ms-in-maharashtra',
  },
  {
    id: 'uttarakhand',
    label: 'MD/MS in Uttarakhand',
    href: '/md-ms/uttarakhand',
    shortLabel: 'UK',
    wpSlug: 'md-ms-in-uttarakhand',
  },
  {
    id: 'tamil-nadu',
    label: 'MD/MS in Tamil Nadu',
    href: '/md-ms/tamil-nadu',
    shortLabel: 'TN',
    wpSlug: 'md-ms-in-tamil-nadu',
  },
];

export function getMdMsNavItemById(id: string): MdMsNavItem | undefined {
  return MD_MS_NAV_ITEMS.find((item) => item.id === id);
}
