import Link from 'next/link';
import { Calculator, GraduationCap, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { NeetRankPredictorWizard } from '@/components/neet-rank-predictor/NeetRankPredictorWizard';
import { NeetRankPredictorContent } from '@/components/neet-rank-predictor/NeetRankPredictorContent';
import { NEET_EXAM_YEAR_LABEL } from '@/lib/neetRankPredictor/data';
import { getContentBySlug } from '@/lib/contentApi';
import { buildSiteMetadata } from '@/lib/buildSiteMetadata';
import { plainTitle } from '@/lib/wpHtmlPrepare';
import '@/styles/neet-rank-predictor.css';

export const revalidate = 300;

export async function generateMetadata() {
  const content = await getContentBySlug('neet-rank-predictor');
  if (!content) {
    return {
      title: 'NEET Rank Predictor 2026 | NEET Marks vs Rank 2026',
      description:
        'Predict your rank with our accurate NEET Rank Predictor 2026. Check the latest NEET Marks vs Rank trends to evaluate your MBBS college options instantly.',
      keywords: ['NEET Rank Predictor 2026', 'NEET Marks vs Rank 2026'],
      alternates: { canonical: '/neet-rank-predictor' },
    };
  }
  return buildSiteMetadata({
    ...content,
    slug: 'neet-rank-predictor',
  });
}

const STATS = [
  { icon: Users, value: '23L+', label: 'Students' },
  { icon: GraduationCap, value: '700+', label: 'Colleges' },
  { icon: ShieldCheck, value: '100%', label: 'Trusted tool' },
];

export default async function NeetRankPredictorPage() {
  const cms = await getContentBySlug('neet-rank-predictor');
  const cmsTitle = cms ? plainTitle(cms.title) : null;
  const cmsSubtitle = cms?.metaDescription?.trim() || null;

  return (
    <div className="neet-predictor-page min-w-0">
      <section className="neet-predictor-hero relative px-4 pb-24 pt-10 md:pb-28 md:pt-14">
        <div className="relative z-[1] mx-auto max-w-6xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-gold-400" aria-hidden />
            {NEET_EXAM_YEAR_LABEL}
          </span>

          <h1 className="mt-5 max-w-3xl font-serif text-[clamp(1.85rem,5vw,3.25rem)] font-bold leading-tight text-white">
            {cmsTitle ? (
              <>
                {cmsTitle}{' '}
                <span className="text-gold-400">know your rank &amp; colleges</span>
              </>
            ) : (
              <>
                NEET Rank Predictor, <span className="text-gold-400">know your rank &amp; colleges</span>
              </>
            )}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-blue-50/95 md:text-base">
            {cmsSubtitle ||
              'Same trusted AR Group experience as our MBBS counselling, enter your score, unlock expected AIR, percentile, and matched MBBS India / Abroad colleges.'}
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
            href="#neet-rank-tool"
            className="ui-btn ui-btn--primary ui-btn--lg ui-btn--pill mt-8"
          >
            <Calculator className="h-5 w-5" aria-hidden />
            Start predictor below
          </Link>
        </div>
      </section>

      <section className="neet-predictor-tool-wrap">
        <NeetRankPredictorWizard />
      </section>

      <NeetRankPredictorContent />
    </div>
  );
}
