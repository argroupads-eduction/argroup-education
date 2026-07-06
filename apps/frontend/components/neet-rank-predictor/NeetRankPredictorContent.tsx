import { ClipboardList, GraduationCap, LineChart } from 'lucide-react';
import { ContentSidebar } from '@/components/content/ContentSidebar';
import {
  CATEGORY_CUTOFF_TABLE,
  HOW_TO_STEPS,
  MARKS_VS_RANK_TABLE,
  NEET_PREDICTOR_FAQ,
  PERCENTILE_VS_RANK_TABLE,
  RANK_VS_COLLEGE,
} from '@/lib/neetRankPredictor/data';

const HOW_ICONS = [ClipboardList, GraduationCap, LineChart] as const;

function MarksLadder({
  rows,
}: {
  rows: readonly { marks: string; rank: string }[];
}) {
  return (
    <div className="neet-ladder">
      {rows.map((row, i) => (
        <div key={row.marks} className="neet-ladder-row">
          <span className="neet-ladder-row__marks">{row.marks}</span>
          <span className="neet-ladder-row__rank">{row.rank}</span>
          <div
            className="neet-ladder-row__bar"
            style={{ opacity: 0.25 + (1 - i / rows.length) * 0.55 }}
            aria-hidden
          />
        </div>
      ))}
    </div>
  );
}

export function NeetRankPredictorContent() {
  return (
    <div className="neet-content-zone">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="neet-content-grid">
          <div className="neet-content-main space-y-12 md:space-y-14">
      <section className="neet-how-section">
        <div className="neet-how-section__head">
          <h2 className="neet-section-title">How to use NEET Rank Predictor</h2>
          <p className="neet-section-lead">
            Three quick steps, same trusted AR Group counselling flow. Get your expected rank and college
            matches in seconds.
          </p>
        </div>

        <ol className="neet-how-timeline">
          {HOW_TO_STEPS.map((s, i) => {
            const Icon = HOW_ICONS[i] ?? ClipboardList;
            return (
              <li key={s.step} className="neet-how-timeline__item">
                <div className="neet-how-timeline__rail" aria-hidden>
                  <span className="neet-how-timeline__dot">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  {i < HOW_TO_STEPS.length - 1 ? <span className="neet-how-timeline__line" /> : null}
                </div>
                <article className="neet-how-timeline__card">
                  <span className="neet-how-timeline__step">{s.step}</span>
                  <h3 className="neet-how-timeline__title">{s.title}</h3>
                  <p className="neet-how-timeline__text">{s.text}</p>
                </article>
              </li>
            );
          })}
        </ol>
      </section>

      <section>
        <h2 className="neet-section-title">NEET marks vs rank (NEET 2026)</h2>
        <p className="neet-section-lead">
          All India Rank ranges from NTA NEET UG 2026 official statistics after the re-exam result release (20 Jul
          2026 onward). Before that, expected ranks follow coaching consensus trends.
        </p>
        <div className="mt-8">
          <MarksLadder rows={MARKS_VS_RANK_TABLE} />
        </div>
      </section>

      <section>
        <h2 className="neet-section-title">Rank vs percentile</h2>
        <p className="neet-section-lead">Understand where your percentile places you among all candidates.</p>
        <div className="mt-8">
          <MarksLadder
            rows={PERCENTILE_VS_RANK_TABLE.map((r) => ({
              marks: `${r.percentile} percentile`,
              rank: r.rank,
            }))}
          />
        </div>
      </section>

      <section>
        <h2 className="neet-section-title">Category-wise qualifying marks</h2>
        <div className="mt-8">
          <MarksLadder
            rows={CATEGORY_CUTOFF_TABLE.map((r) => ({
              marks: r.category,
              rank: `${r.percentile} · ${r.marks}`,
            }))}
          />
        </div>
      </section>

      <section>
        <h2 className="neet-section-title">Rank vs possible colleges</h2>
        <p className="neet-section-lead">
          Indicative college tiers from previous year counselling trends, plan with AR Group experts.
        </p>
        <div className="neet-rank-band-grid mt-8">
          {[
            { range: '1 – 1,000', text: RANK_VS_COLLEGE[0].label },
            { range: '1K – 5K', text: RANK_VS_COLLEGE[1].label },
            { range: '5K – 15K', text: RANK_VS_COLLEGE[2].label },
            { range: '15K – 30K', text: RANK_VS_COLLEGE[3].label },
            { range: '30K – 60K', text: RANK_VS_COLLEGE[4].label },
            { range: '60K – 1L', text: RANK_VS_COLLEGE[5].label },
            { range: '1L+', text: RANK_VS_COLLEGE[6].label },
          ].map((b) => (
            <div key={b.range} className="neet-rank-band">
              <span className="neet-rank-band__range">{b.range}</span>
              <p className="neet-rank-band__text">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="neet-section-title">Frequently asked questions</h2>
        <dl className="mt-8 space-y-3">
          {NEET_PREDICTOR_FAQ.map((item) => (
            <div key={item.q} className="neet-faq-item">
              <dt className="font-semibold text-navy-900">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
          </div>

          <aside className="neet-content-aside">
            <ContentSidebar />
          </aside>
        </div>
      </div>
    </div>
  );
}
