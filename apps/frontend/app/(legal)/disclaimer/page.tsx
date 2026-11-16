import type { Metadata } from 'next';
import { DisclaimerPageView } from '@/components/legal/DisclaimerPageView';
import { getSiteUrl } from '@/lib/siteUrl';

const SEO_TITLE = 'Disclaimer';
const SEO_DESCRIPTION =
  'Official AR Group of Education disclaimer on information accuracy, MBBS admission guidance, visa support, third-party links, and user responsibilities for India & abroad counselling.';

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  alternates: {
    canonical: '/disclaimer',
  },
  openGraph: {
    title: `${SEO_TITLE} | AR Group of Education`,
    description: SEO_DESCRIPTION,
    url: `${getSiteUrl()}/disclaimer`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: `${SEO_TITLE} | AR Group of Education`,
    description: SEO_DESCRIPTION,
  },
};

export default function DisclaimerPage() {
  return <DisclaimerPageView />;
}
