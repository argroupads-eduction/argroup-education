'use client';

import Link from 'next/link';

type CollegePredictorNavCtaProps = {
  onClick?: () => void;
};

export function CollegePredictorNavCta({ onClick }: CollegePredictorNavCtaProps) {
  return (
    <div className="nav-neet-cta-wrap">
      <span className="nav-live-pill" aria-hidden>
        <span className="nav-live-pill__ping" />
        <span className="nav-live-pill__dot" />
        LIVE
      </span>
      <Link href="/college-predictor" onClick={onClick} className="nav-neet-cta-btn">
        College Predictor
        <span className="nav-neet-cta-btn__badge">NEW</span>
      </Link>
    </div>
  );
}
