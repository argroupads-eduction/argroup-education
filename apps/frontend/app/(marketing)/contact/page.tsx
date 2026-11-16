import { Metadata } from 'next';
import { ContactPageView } from '@/components/contact/ContactPageView';
import { getSiteUrl } from '@/lib/siteUrl';

const SITE = getSiteUrl();
const CONTACT_SEO_TITLE = 'Contact AR Group of Education | Admission Consultancy Contact';
const CONTACT_SEO_DESCRIPTION =
  'Get in touch with the AR Group of Education team. Reach out to our admission consultancy contact experts today for personalized course and college guidance.';

export const metadata: Metadata = {
  title: CONTACT_SEO_TITLE,
  description: CONTACT_SEO_DESCRIPTION,
  keywords: ['Contact AR Group of Education', 'Admission Consultancy Contact'],
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
