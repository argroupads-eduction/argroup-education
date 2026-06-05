import { Metadata } from 'next';
import { ContactPageView } from '@/components/contact/ContactPageView';

export const metadata: Metadata = {
  title: 'Contact Us | Expert MBBS Counselling',
  description:
    'Contact AR Group of Education for expert MBBS India & abroad counselling. Call, WhatsApp, or book a session online.',
};

export default function ContactPage() {
  return <ContactPageView />;
}
