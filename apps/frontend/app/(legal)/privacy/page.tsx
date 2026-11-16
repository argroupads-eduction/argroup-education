import type { Metadata } from 'next';
import { PrivacyPageView } from '@/components/legal/PrivacyPageView';
import { getSiteUrl } from '@/lib/siteUrl';

const SEO_TITLE = 'Privacy Policy';
const SEO_DESCRIPTION =
  'AR Group of Education privacy policy — how we collect, use, protect, and share your data for MBBS counselling forms, website visits, and student support services.';

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: `${SEO_TITLE} | AR Group of Education`,
    description: SEO_DESCRIPTION,
    url: `${getSiteUrl()}/privacy`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: `${SEO_TITLE} | AR Group of Education`,
    description: SEO_DESCRIPTION,
  },
};

export default function PrivacyPage() {
  return <PrivacyPageView />;
}
