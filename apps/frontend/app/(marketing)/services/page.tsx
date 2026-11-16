import type { Metadata } from 'next';
import { ServicesPageView } from '@/components/services/ServicesPageView';
import { SERVICES_SEO } from '@/lib/servicesContent';
import { getSiteUrl } from '@/lib/siteUrl';

export const metadata: Metadata = {
  title: SERVICES_SEO.title,
  description: SERVICES_SEO.description,
  keywords: [...SERVICES_SEO.keywords],
  alternates: {
    canonical: '/services',
  },
  openGraph: {
    title: `${SERVICES_SEO.title} | AR Group of Education`,
    description: SERVICES_SEO.description,
    url: `${getSiteUrl()}/services`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: `${SERVICES_SEO.title} | AR Group of Education`,
    description: SERVICES_SEO.description,
  },
};

export default function ServicesPage() {
  return <ServicesPageView />;
}
