'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Home, Phone } from 'lucide-react';
import { CONTACT_INFO } from '@/lib/constants';
import {
  clearCounsellingSubmitted,
  readCounsellingSubmitted,
} from '@/lib/counsellingFormSession';
import '@/styles/thank-you-page.css';

function phoneDisplay(): string {
  return CONTACT_INFO?.phone?.trim() || '+91-7076909090';
}

function phoneTelHref(): string {
  const tel = CONTACT_INFO?.phoneTel?.trim() || '+917076909090';
  return `tel:${tel}`;
}

export function ThankYouPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let t2: number | undefined;
    let t3: number | undefined;

    const acceptFromQuery = () => {
      try {
        if (searchParams.get('ok') !== '1') return false;
        const name = searchParams.get('name')?.trim();
        if (name) setFirstName(name.split(/\s+/)[0] ?? null);
        setReady(true);
        clearCounsellingSubmitted();
        return true;
      } catch {
        return false;
      }
    };

    const acceptSession = () => {
      try {
        const session = readCounsellingSubmitted();
        if (!session || cancelled) return false;
        setFirstName(session.name?.split(/\s+/)[0] ?? null);
        setReady(true);
        clearCounsellingSubmitted();
        return true;
      } catch {
        return false;
      }
    };

    if (acceptFromQuery() || acceptSession()) return;

    const t1 = window.setTimeout(() => {
      if (acceptFromQuery() || acceptSession()) return;
      t2 = window.setTimeout(() => {
        if (acceptFromQuery() || acceptSession()) return;
        t3 = window.setTimeout(() => {
          if (!cancelled && !(acceptFromQuery() || acceptSession())) {
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
  }, [router, searchParams]);

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
          <strong className="text-navy-900">{phoneDisplay()}</strong> (or the number you
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
            <span>You decide, zero pressure, 100% confidential</span>
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
            href={phoneTelHref()}
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
