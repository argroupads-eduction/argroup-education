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
    coverImage:
      'https://argroupofeducation.com/wp-content/uploads/2025/09/WhatsApp-Image-2025-09-05-at-4.49.13-PM.jpeg',
  },
  {
    id: 'karnataka',
    label: 'MD/MS in Karnataka',
    href: '/md-ms/karnataka',
    shortLabel: 'KA',
    wpSlug: 'md-ms-in-karnataka',
    coverImage:
      'https://argroupofeducation.com/wp-content/uploads/2025/09/WhatsApp-Image-2025-09-08-at-12.07.12-PM.jpeg',
  },
  {
    id: 'haryana',
    label: 'MD/MS in Haryana',
    href: '/md-ms/haryana',
    shortLabel: 'HR',
    wpSlug: 'md-ms-in-haryana',
    coverImage:
      'https://argroupofeducation.com/wp-content/uploads/2025/09/WhatsApp-Image-2025-09-08-at-12.09.53-PM.jpeg',
  },
  {
    id: 'mp',
    label: 'MD/MS in Madhya Pradesh',
    href: '/md-ms/mp',
    shortLabel: 'MP',
    wpSlug: 'md-ms-in-madhya-pradesh',
    coverImage:
      'https://argroupofeducation.com/wp-content/uploads/2025/09/WhatsApp-Image-2025-09-08-at-12.12.53-PM.jpeg',
  },
  {
    id: 'chhattisgarh',
    label: 'MD/MS in Chhattisgarh',
    href: '/md-ms/chhattisgarh',
    shortLabel: 'CG',
    wpSlug: 'md-ms-in-chhattisgarh',
    coverImage:
      'https://argroupofeducation.com/wp-content/uploads/2025/09/WhatsApp-Image-2025-09-20-at-1.30.00-PM.jpeg',
  },
  {
    id: 'rajasthan',
    label: 'MD/MS in Rajasthan',
    href: '/md-ms/rajasthan',
    shortLabel: 'RJ',
    wpSlug: 'md-ms-in-rajasthan',
    coverImage:
      'https://argroupofeducation.com/wp-content/uploads/2025/09/WhatsApp-Image-2025-09-11-at-1.06.53-PM.jpeg',
  },
  {
    id: 'maharashtra',
    label: 'MD/MS in Maharashtra',
    href: '/md-ms/maharashtra',
    shortLabel: 'MH',
    wpSlug: 'md-ms-in-maharashtra',
    coverImage:
      'https://argroupofeducation.com/wp-content/uploads/2025/09/WhatsApp-Image-2025-09-13-at-3.59.48-PM.jpeg',
  },
  {
    id: 'uttarakhand',
    label: 'MD/MS in Uttarakhand',
    href: '/md-ms/uttarakhand',
    shortLabel: 'UK',
    wpSlug: 'md-ms-in-uttarakhand',
    coverImage:
      'https://argroupofeducation.com/wp-content/uploads/2025/09/WhatsApp-Image-2025-09-18-at-4.39.47-PM.jpeg',
  },
  {
    id: 'tamil-nadu',
    label: 'MD/MS in Tamil Nadu',
    href: '/md-ms/tamil-nadu',
    shortLabel: 'TN',
    wpSlug: 'md-ms-in-tamil-nadu',
    coverImage:
      'https://argroupofeducation.com/wp-content/uploads/2025/09/WhatsApp-Image-2025-09-20-at-11.31.14-AM.jpeg',
  },
];

export function getMdMsNavItemById(id: string): MdMsNavItem | undefined {
  return MD_MS_NAV_ITEMS.find((item) => item.id === id);
}
