/**
 * Seed Payload globals from current live-site constants (merge baseline — nothing removed).
 *
 * Usage:
 *   npx tsx scripts/seed-site-globals.mts
 *   npx tsx scripts/seed-site-globals.mts --dry-run
 */

import 'dotenv/config';
import { getPayload } from 'payload';
import config from '@payload-config';

const COMPANY_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Disclaimer', href: '/disclaimer' },
];

const PROGRAM_LINKS = [
  { label: 'MBBS in India', href: '/mbbs-india' },
  { label: 'MBBS Abroad', href: '/mbbs-abroad' },
  { label: 'MD / MS', href: '/md-ms' },
  { label: 'Blog & Updates', href: '/blog' },
  { label: 'Services', href: '/services' },
];

const SOCIAL_LINKS = [
  { platform: 'facebook', url: 'https://facebook.com/argroupedu' },
  { platform: 'instagram', url: 'https://instagram.com/argroupedu' },
  { platform: 'youtube', url: 'https://youtube.com/@argroupedu' },
  { platform: 'linkedin', url: 'https://linkedin.com/company/argroupedu' },
  { platform: 'twitter', url: 'https://twitter.com/argroupedu' },
  { platform: 'whatsapp', url: 'https://wa.me/919667006402' },
];

const CONTACT = {
  phone: '+91-7076909090',
  phoneTel: '+917076909090',
  email: 'info@argroupofeducation.com',
  whatsapp: 'https://wa.me/919667006402',
  address: 'Sector 18, Noida · Wave Silver Tower, Office 523',
  hours: '24×7 — open all week',
};

const SEO_DEFAULTS = {
  defaultMetaTitle: 'AR Group of Education | Medical Education Consultancy',
  defaultMetaDescription:
    'Premium educational consultancy for MBBS abroad. Expert guidance, 4000+ successful students, 500+ universities, 98% visa success rate.',
};

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const payload = await getPayload({ config });

  const seeds: { slug: 'footer' | 'site-settings'; data: Record<string, unknown> }[] = [
    {
      slug: 'footer',
      data: {
        companyLinks: COMPANY_LINKS,
        programLinks: PROGRAM_LINKS,
        navItems: [],
      },
    },
    {
      slug: 'site-settings',
      data: {
        ...CONTACT,
        socialLinks: SOCIAL_LINKS,
        ...SEO_DEFAULTS,
      },
    },
  ];

  for (const { slug, data } of seeds) {
    if (dryRun) {
      console.log(`[dry-run] would seed global "${slug}"`);
      continue;
    }

    await payload.updateGlobal({
      slug,
      data,
      overrideAccess: true,
      context: { disableRevalidate: true, disableBackendSync: true },
    });
    console.log(`Seeded global "${slug}"`);
  }

  console.log('Done. Run npm run payload:sync:globals to push to Neon.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
