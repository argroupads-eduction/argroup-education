'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Home, Phone } from 'lucide-react';
import { CONTACT_INFO } from '@/lib/constants';
import {
  clearCounsellingSubmitted,
  readCounsellingSubmitted,
} from '@/lib/counsellingFormSession';
import '@/styles/thank-you-page.css';

export function ThankYouPageView() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let t2: number | undefined;
    let t3: number | undefined;

    const acceptSession = () => {
      const session = readCounsellingSubmitted();
      if (!session || cancelled) return false;
      setFirstName(session.name?.split(/\s+/)[0] ?? null);
      setReady(true);
      clearCounsellingSubmitted();
      return true;
    };

    if (acceptSession()) return;

    const t1 = window.setTimeout(() => {
      if (acceptSession()) return;
      t2 = window.setTimeout(() => {
        if (acceptSession()) return;
        t3 = window.setTimeout(() => {
          if (!cancelled && !acceptSession()) {
            router.replace('/contact');
          }
        }, 400);
      }, 200);
    }, 50);

    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      if (t2) window.clearTimeout(t2);
      if (t3) window.clearTimeout(t3);
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="thank-you-page thank-you-page--loading" aria-live="polite">
        <p className="thank-you-page__loading-text">Confirming your request…</p>
      </div>
    );
  }

  return (
    <div className="thank-you-page">
      <div className="thank-you-page__mesh" aria-hidden />
      <div className="thank-you-page__card">
        <div className="thank-you-page__icon-wrap" aria-hidden>
          <CheckCircle2 className="thank-you-page__icon" />
        </div>

        <h1 className="thank-you-page__title">
          {firstName ? `Thank you, ${firstName}!` : 'Thank you!'}
        </h1>
        <p className="thank-you-page__lead">
          Your counselling request is confirmed. Our team will call you within{' '}
          <strong className="text-gold-700">24 hours</strong> on{' '}
          <strong className="text-navy-900">{CONTACT_INFO.phone}</strong> (or the number you
          provided).
        </p>

        <ul className="thank-you-page__steps">
          <li>
            <span className="thank-you-page__step-num">1</span>
            <span>Counsellor reviews your NEET score & preferences</span>
          </li>
          <li>
            <span className="thank-you-page__step-num">2</span>
            <span>We shortlist MBBS India / abroad options with clear fees</span>
          </li>
          <li>
            <span className="thank-you-page__step-num">3</span>
            <span>You decide — zero pressure, 100% confidential</span>
          </li>
        </ul>

        <div className="thank-you-page__actions">
          <Link href="/" className="ui-btn ui-btn--navy ui-btn--pill ui-btn--md gap-2">
            <Home className="h-4 w-4" aria-hidden />
            Back to home
          </Link>
          <Link href="/mbbs-india" className="ui-btn ui-btn--secondary ui-btn--pill ui-btn--md">
            Explore MBBS India
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={`tel:${CONTACT_INFO.phoneTel}`}
            className="thank-you-page__call ui-btn ui-btn--primary ui-btn--pill ui-btn--md gap-2"
          >
            <Phone className="h-4 w-4" aria-hidden />
            Call now
          </a>
        </div>

        <p className="thank-you-page__note">
          Need to update details?{' '}
          <Link href="/contact" className="thank-you-page__link">
            Submit the form again
          </Link>
        </p>
      </div>
    </div>
  );
}
