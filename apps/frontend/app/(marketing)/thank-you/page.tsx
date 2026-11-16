import { Metadata } from 'next';
import { Suspense } from 'react';
import { ThankYouPageView } from '@/components/contact/ThankYouPageView';
import '@/styles/thank-you-page.css';

export const metadata: Metadata = {
  title: 'Thank You | Counselling Request Received',
  description: 'Your MBBS counselling request has been received. AR Group will contact you soon.',
  robots: { index: false, follow: false },
};

function ThankYouFallback() {
  return (
    <div className="thank-you-page thank-you-page--loading" aria-live="polite">
      <p className="thank-you-page__loading-text">Confirming your request…</p>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<ThankYouFallback />}>
      <ThankYouPageView />
    </Suspense>
  );
}
