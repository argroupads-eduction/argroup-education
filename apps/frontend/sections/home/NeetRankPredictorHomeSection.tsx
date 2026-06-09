'use client';

import Link from 'next/link';
import { ArrowRight, Calculator, GraduationCap, Sparkles, TrendingUp } from 'lucide-react';

/** Home teaser only, full tool lives on /neet-rank-predictor */
export function NeetRankPredictorHomeSection() {
  return (
    <section
      id="neet-rank-promo"
      className="relative overflow-hidden bg-gradient-to-b from-white via-navy-50/50 to-gold-50/30 py-14 md:py-20"
    >
      <div
        className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-navy-400/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-gold-400/20 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4">
        <div className="overflow-hidden rounded-3xl border border-navy-200/80 bg-gradient-to-br from-white via-navy-50/40 to-gold-50/60 p-6 shadow-xl shadow-navy-900/10 ring-1 ring-gold-300/40 md:p-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-300 bg-gold-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gold-800">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              Live · NEET Rank Predictor
            </span>

            <h2 className="mt-5 font-serif text-3xl font-bold leading-tight text-navy-900 md:text-4xl">
              Know your NEET rank{' '}
              <span className="text-gold-600">before results</span>
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
              Trusted AR Group tool, enter your score, see expected AIR, percentile, and MBBS India /
              Abroad colleges matched to you. Takes under a minute.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-navy-800">
              {[
                'MBBS India, Abroad, or both, one smart form',
                'Live rank preview as you enter your score',
                'College shortlists you can explore instantly',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/neet-rank-predictor" className="ui-btn ui-btn--primary ui-btn--lg inline-flex">
                <Calculator className="h-5 w-5" aria-hidden />
                Check my NEET rank
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <p className="text-xs font-medium text-slate-500">Instant results · Trusted by AR Group</p>
            </div>
          </div>

          <Link
            href="/neet-rank-predictor"
            className="group relative mt-8 block lg:mt-0"
            aria-label="Open NEET Rank Predictor"
          >
            <div className="relative overflow-hidden rounded-2xl border border-navy-200/90 bg-white p-5 shadow-lg transition duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:ring-2 group-hover:ring-gold-400/50">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wide text-navy-700">
                  Sample preview
                </span>
                <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold text-gold-800">
                  Tap to start
                </span>
              </div>

              <p className="mt-4 text-sm text-slate-500">Score 420 / 720 · General</p>
              <p className="mt-1 font-serif text-3xl font-bold text-navy-900">
                AIR ~<span className="text-gold-600">80,372</span>
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: 'Best', value: '72K' },
                  { label: 'Likely', value: '80K' },
                  { label: 'Buffer', value: '89K' },
                ].map((b) => (
                  <div
                    key={b.label}
                    className="rounded-lg bg-navy-50 px-2 py-2 text-center ring-1 ring-navy-100"
                  >
                    <p className="text-[9px] font-bold uppercase text-slate-500">{b.label}</p>
                    <p className="text-sm font-bold text-navy-900">{b.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 rounded-lg bg-gold-50/80 px-3 py-2 text-xs font-semibold text-navy-800">
                  <GraduationCap className="h-4 w-4 text-gold-600" aria-hidden />
                  MBBS India colleges matched
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-navy-50 px-3 py-2 text-xs font-semibold text-navy-800">
                  <TrendingUp className="h-4 w-4 text-navy-600" aria-hidden />
                  MBBS Abroad options matched
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center bg-navy-900/0 opacity-0 transition group-hover:bg-navy-900/5 group-hover:opacity-100">
                <span className="translate-y-2 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-bold text-navy-900 shadow-lg transition group-hover:translate-y-0">
                  Open predictor →
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
