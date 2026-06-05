'use client';

import Link from 'next/link';
import { NEET_RANK_PREDICTOR_LINK } from '@/lib/constants';

type NeetRankNavCtaProps = {
  onClick?: () => void;
};

export function NeetRankNavCta({ onClick }: NeetRankNavCtaProps) {
  return (
    <div className="nav-neet-cta-wrap">
      <span className="nav-live-pill" aria-hidden>
        <span className="nav-live-pill__ping" />
        <span className="nav-live-pill__dot" />
        LIVE
      </span>
      <Link href={NEET_RANK_PREDICTOR_LINK.href} onClick={onClick} className="nav-neet-cta-btn">
        {NEET_RANK_PREDICTOR_LINK.label}
        <span className="nav-neet-cta-btn__badge">NEW</span>
      </Link>
    </div>
  );
}
