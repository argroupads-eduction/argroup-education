import Link from 'next/link';
import { ArrowRight, Calculator, Check, GraduationCap, TrendingUp } from 'lucide-react';
import '@/styles/home-rank-promo.css';

/**
 * Home Rank Predictor — navy+gold stage (site palette).
 * Distinct from College Predictor light card; uses dedicated CSS (no missing Tailwind shades).
 */
export function NeetRankPredictorHomeSection() {
  const bullets = [
    'MBBS India, Abroad, MD/MS or BAMS — one smart form',
    'Live rank preview as you enter your score',
    'College shortlists you can explore instantly',
  ] as const;

  return (
    <section
      id="neet-rank-promo"
      className="home-rank-promo"
      aria-labelledby="neet-rank-home-heading"
    >
      <div className="home-rank-promo__shell">
        <div className="home-rank-promo__stage">
          <div className="home-rank-promo__copy">
            <span className="home-rank-promo__badge">
              <span className="home-rank-promo__live" aria-hidden />
              Live · NEET Rank Predictor
            </span>

            <h2 id="neet-rank-home-heading" className="home-rank-promo__title">
              Know your NEET rank <em>before results</em>
            </h2>

            <p className="home-rank-promo__lead">
              Trusted AR Group tool — enter your score, see expected AIR, percentile, and MBBS India /
              Abroad colleges matched to you. Takes under a minute.
            </p>

            <ul className="home-rank-promo__list">
              {bullets.map((t) => (
                <li key={t}>
                  <span className="home-rank-promo__check" aria-hidden>
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>

            <div className="home-rank-promo__actions">
              <Link href="/neet-rank-predictor" className="home-rank-promo__cta">
                <Calculator className="h-5 w-5" aria-hidden />
                Check my NEET rank
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <p className="home-rank-promo__note">Instant results · Trusted by AR Group</p>
            </div>
          </div>

          <div className="home-rank-promo__visual">
            <Link
              href="/neet-rank-predictor"
              className="home-rank-promo__preview"
              aria-label="Open NEET Rank Predictor"
            >
              <div className="home-rank-promo__preview-top">
                <span>Sample preview</span>
                <span className="home-rank-promo__tap">Tap to start</span>
              </div>

              <div className="relative home-rank-promo__meter">
                <svg viewBox="0 0 100 100" aria-hidden>
                  <defs>
                    <linearGradient id="homeRankGold" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ffb74d" />
                      <stop offset="100%" stopColor="#e65100" />
                    </linearGradient>
                  </defs>
                  <circle className="home-rank-promo__meter-track" cx="50" cy="50" r="35" />
                  <circle className="home-rank-promo__meter-value" cx="50" cy="50" r="35" />
                </svg>
                <div className="home-rank-promo__meter-center">
                  <strong>420</strong>
                  <span>/ 720</span>
                </div>
              </div>

              <p className="home-rank-promo__score-line">General category · sample</p>
              <p className="home-rank-promo__air">
                AIR ~<b>80,372</b>
              </p>

              <div className="home-rank-promo__bands">
                <div>
                  <p>Best</p>
                  <strong>72K</strong>
                </div>
                <div>
                  <p>Likely</p>
                  <strong>80K</strong>
                </div>
                <div>
                  <p>Buffer</p>
                  <strong>89K</strong>
                </div>
              </div>

              <div className="home-rank-promo__chips">
                <span>
                  <GraduationCap className="h-3.5 w-3.5 text-gold-600" aria-hidden />
                  MBBS India colleges matched
                </span>
                <span>
                  <TrendingUp className="h-3.5 w-3.5 text-navy-600" aria-hidden />
                  MBBS Abroad options matched
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
