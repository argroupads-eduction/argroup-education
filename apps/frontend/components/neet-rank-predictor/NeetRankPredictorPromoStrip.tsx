'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, X } from 'lucide-react';

const STORAGE_KEY = 'ar-neet-predictor-promo-dismissed';

export function NeetRankPredictorPromoStrip() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname === '/neet-rank-predictor') {
      setVisible(false);
      return;
    }
    try {
      setVisible(sessionStorage.getItem(STORAGE_KEY) !== '1');
    } catch {
      setVisible(true);
    }
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="relative z-[45] border-b border-navy-800/20 bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white"
      role="region"
      aria-label="NEET Rank Predictor promotion"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-stretch gap-2.5 px-4 py-2.5 text-center text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:text-left">
        <p className="flex min-w-0 flex-wrap items-center justify-center gap-2 font-medium leading-snug sm:justify-start">
          <Calculator className="h-4 w-4 shrink-0 text-amber-200" aria-hidden />
          <span className="min-w-0">
            <strong className="text-amber-200">NEW:</strong> NEET Rank Predictor 2026 — know your
            expected rank &amp; college chances in seconds
          </span>
        </p>
        <div className="flex shrink-0 items-center justify-center gap-2 sm:justify-end">
          <Link
            href="/neet-rank-predictor"
            className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-teal-900 shadow hover:bg-amber-50"
          >
            Try now →
          </Link>
          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.setItem(STORAGE_KEY, '1');
              } catch {
                /* ignore */
              }
              setVisible(false);
            }}
            className="rounded-full p-1 hover:bg-white/15"
            aria-label="Dismiss promotion"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
