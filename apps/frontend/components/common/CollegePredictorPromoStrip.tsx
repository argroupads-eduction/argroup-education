'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, X } from 'lucide-react';

const STORAGE_KEY = 'ar-college-predictor-promo-v2-dismissed';

/** Top/mobile promo — College Predictor (replaces Rank Predictor strip). */
export function CollegePredictorPromoStrip() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname === '/college-predictor') {
      setVisible(false);
      return;
    }
    try {
      setVisible(sessionStorage.getItem(STORAGE_KEY) !== '1');
    } catch {
      setVisible(true);
    }
  }, [pathname]);

  const dismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <div
        className="relative z-[45] hidden border-b border-navy-800/20 bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white sm:block"
        role="region"
        aria-label="College Predictor promotion"
      >
        <div className="relative mx-auto flex max-w-6xl items-center justify-center px-4 py-2.5 pr-12 text-sm">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <p className="flex items-center gap-2 font-medium leading-snug">
              <GraduationCap className="h-4 w-4 shrink-0 text-amber-200" aria-hidden />
              <span>
                <strong className="text-amber-200">NEW:</strong> College Predictor 2026, know which
                colleges match your NEET rank in seconds
              </span>
            </p>
            <Link
              href="/college-predictor"
              className="inline-flex shrink-0 items-center rounded-full bg-white px-4 py-1.5 text-xs font-bold text-teal-900 shadow transition hover:bg-amber-50"
            >
              Try now →
            </Link>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 hover:bg-white/15"
            aria-label="Dismiss promotion"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden"
        role="region"
        aria-label="College Predictor promotion"
      >
        <div className="pointer-events-auto mx-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 p-3.5 text-white shadow-[0_12px_40px_rgba(15,23,42,0.45)]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 ring-1 ring-amber-300/30">
            <GraduationCap className="h-5 w-5 text-amber-200" aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium leading-snug text-white">
              <strong className="text-amber-200">NEW:</strong> College Predictor 2026
            </p>
            <p className="mt-0.5 text-[12px] leading-snug text-slate-300">
              Know which colleges match your NEET rank in seconds
            </p>
            <Link
              href="/college-predictor"
              className="mt-2.5 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-bold text-teal-900 shadow-sm active:scale-[0.98]"
            >
              Try now →
            </Link>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Dismiss promotion"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export default CollegePredictorPromoStrip;
