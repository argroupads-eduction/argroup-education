import { Metadata } from 'next';
import { ThankYouPageView } from '@/components/contact/ThankYouPageView';

export const metadata: Metadata = {
  title: 'Thank You | Counselling Request Received',
  description: 'Your free MBBS counselling request has been received. AR Group will contact you soon.',
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return <ThankYouPageView />;
}
