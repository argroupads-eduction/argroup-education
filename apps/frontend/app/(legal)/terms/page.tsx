import type { Metadata } from 'next';
import { TermsPageView } from '@/components/legal/TermsPageView';
import { getSiteUrl } from '@/lib/siteUrl';

const SEO_TITLE = 'Terms & Conditions';
const SEO_DESCRIPTION =
  'Read AR Group of Education terms for website use, admission guidance, visa support limits, user responsibilities, and governing law for MBBS India & abroad counselling.';

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: `${SEO_TITLE} | AR Group of Education`,
    description: SEO_DESCRIPTION,
    url: `${getSiteUrl()}/terms`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: `${SEO_TITLE} | AR Group of Education`,
    description: SEO_DESCRIPTION,
  },
};

export default function TermsPage() {
  return <TermsPageView />;
}
