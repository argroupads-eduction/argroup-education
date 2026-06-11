import { Metadata } from 'next';
import { ContactPageView } from '@/components/contact/ContactPageView';
import { getSiteUrl } from '@/lib/siteUrl';

const SITE = getSiteUrl();
const CONTACT_SEO_TITLE = 'Contact Us for Expert Medical Admission Counselling & Guidance';
const CONTACT_SEO_DESCRIPTION =
  'Get expert medical admission counselling for MBBS, MD, and MS courses. Speak with our top consultants and secure your seat today. Reach out now!';

export const metadata: Metadata = {
  title: CONTACT_SEO_TITLE,
  description: CONTACT_SEO_DESCRIPTION,
  alternates: {
    canonical: `${SITE}/contact`,
  },
  openGraph: {
    title: CONTACT_SEO_TITLE,
    description: CONTACT_SEO_DESCRIPTION,
    url: `${SITE}/contact`,
    type: 'website',
    siteName: 'AR Group of Education',
  },
  twitter: {
    card: 'summary',
    title: CONTACT_SEO_TITLE,
    description: CONTACT_SEO_DESCRIPTION,
  },
};

export default function ContactPage() {
  return <ContactPageView />;
}
