import Link from 'next/link';
import { GraduationCap, MapPin, Sparkles } from 'lucide-react';
import { CollegePredictorWizard } from '@/components/college-predictor/CollegePredictorWizard';
import { NEET_EXAM_YEAR_LABEL } from '@/lib/neetRankPredictor/data';
import '@/styles/neet-rank-predictor.css';

export const revalidate = 300;

export async function generateMetadata() {
  return {
    title: 'NEET College Predictor 2026 | Colleges by Your Rank',
    description:
      'Enter your NEET AIR and instantly see MBBS colleges for your rank. Free College Predictor by AR Group of Education.',
    keywords: [
      'NEET College Predictor 2026',
      'MBBS colleges by NEET rank',
      'NEET rank college list',
    ],
    alternates: { canonical: '/college-predictor' },
  };
}

const STATS = [
  { icon: GraduationCap, value: '700+', label: 'Colleges mapped' },
  { icon: MapPin, value: 'All India', label: 'Rank-based matches' },
];

export default function CollegePredictorPage() {
  return (
    <div className="neet-predictor-page min-w-0">
      <section className="neet-predictor-hero relative px-4 pb-24 pt-10 md:pb-28 md:pt-14">
        <div className="relative z-[1] mx-auto max-w-6xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-gold-400" aria-hidden />
            {NEET_EXAM_YEAR_LABEL} · College Predictor
          </span>

          <h1 className="mt-5 max-w-3xl font-serif text-[clamp(1.85rem,5vw,3.25rem)] font-bold leading-tight text-white">
            NEET College Predictor
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-blue-50/95 md:text-base">
            Your NEET AIR can unlock the right medical college. Enter your rank to discover MBBS
            colleges that match your profile, then let AR Group experts guide you through counselling,
            choice filling, and admission.
          </p>

          <div className="mt-8 flex flex-wrap gap-6 md:gap-10">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-gold-400" aria-hidden />
                <div>
                  <p className="text-xl font-bold tabular-nums text-white">{value}</p>
                  <p className="text-[11px] uppercase tracking-wide text-blue-100/80">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="#college-predictor-tool"
            className="ui-btn ui-btn--primary ui-btn--lg ui-btn--pill mt-8"
          >
            <GraduationCap className="h-5 w-5" aria-hidden />
            Check colleges below
          </Link>
        </div>
      </section>

      <section className="neet-predictor-tool-wrap">
        <CollegePredictorWizard />
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 text-center md:py-16">
        <p className="text-sm text-slate-600">
          Looking for marks → rank instead?{' '}
          <Link
            href="/neet-rank-predictor"
            className="font-semibold text-navy-800 underline decoration-gold-400 underline-offset-2 hover:text-gold-700"
          >
            Use the NEET Rank Predictor
          </Link>{' '}
          (also on the home page).
        </p>
      </section>
    </div>
  );
}
