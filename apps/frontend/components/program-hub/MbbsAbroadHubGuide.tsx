import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { MBBS_ABROAD_HUB } from '@/lib/mbbsAbroadHubContent';
import '@/styles/mbbs-abroad-hub-guide.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://argroupofeducation.com';

type MbbsAbroadHubGuideProps = {
  variant: 'intro' | 'extended';
};

export function MbbsAbroadHubGuide({ variant }: MbbsAbroadHubGuideProps) {
  if (variant === 'intro') {
    return (
      <section className="abroad-guide abroad-guide--intro" aria-labelledby="abroad-guide-title">
        <div className="mx-auto max-w-7xl px-4">
          <header className="abroad-guide__intro" id="about-mbbs-abroad">
            <p className="program-hub-section-kicker">Complete guide</p>
            <h2 id="abroad-guide-title" className="program-hub-section-title">
              {MBBS_ABROAD_HUB.overviewTitle}
            </h2>
            <p className="abroad-guide__lead">{MBBS_ABROAD_HUB.overviewLead}</p>
            {MBBS_ABROAD_HUB.overviewParagraphs.map((p) => (
              <p key={p.slice(0, 48)} className="abroad-guide__p">
                {p}
              </p>
            ))}
            <nav className="abroad-guide__jump" aria-label="On this page">
              <a href="#mbbs-abroad-colleges">All universities</a>
              <a href="#mbbs-abroad-countries">Countries</a>
              <a href="#mbbs-abroad-highlights">Comparison table</a>
              <a href="#mbbs-abroad-eligibility">Eligibility</a>
              <a href="#mbbs-abroad-process">Admission steps</a>
              <a href="#mbbs-abroad-faq">FAQs</a>
            </nav>
          </header>
        </div>
      </section>
    );
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: MBBS_ABROAD_HUB.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  return (
    <section className="abroad-guide abroad-guide--extended" aria-label="MBBS abroad detailed guide">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mx-auto max-w-7xl px-4">
        <section
          className="abroad-guide__block"
          id="mbbs-abroad-countries"
          aria-labelledby="countries-title"
        >
          <h3 id="countries-title" className="abroad-guide__h3">
            Popular countries for MBBS abroad
          </h3>
          <p className="abroad-guide__p abroad-guide__p--tight">
            Each destination below links to universities in our directory. Fees, climate, and visa rules
            differ, compare at least two countries before you decide.
          </p>
          <ul className="abroad-guide__countries">
            {MBBS_ABROAD_HUB.countryInsights.map((c) => (
              <li key={c.name}>
                <strong>{c.name}</strong>
                <p>{c.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="abroad-guide__block" id="mbbs-abroad-highlights" aria-labelledby="highlights-title">
          <h3 id="highlights-title" className="abroad-guide__h3">
            MBBS abroad vs MBBS in India, at a glance
          </h3>
          <div className="abroad-guide__table-wrap">
            <table className="abroad-guide__table">
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  <th scope="col">MBBS abroad criteria</th>
                  <th scope="col">MBBS in India</th>
                </tr>
              </thead>
              <tbody>
                {MBBS_ABROAD_HUB.highlights.map((row) => (
                  <tr key={row.feature}>
                    <th scope="row">{row.feature}</th>
                    <td>{row.abroad}</td>
                    <td>{row.india}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="abroad-guide__bento abroad-guide__bento--duo" id="mbbs-abroad-costs">
          <div className="abroad-guide__panel" aria-labelledby="costs-title">
            <h3 id="costs-title" className="abroad-guide__h3 abroad-guide__h3--in-panel">
              What affects your total budget?
            </h3>
            <ul className="abroad-guide__checklist">
              {MBBS_ABROAD_HUB.costFactors.map((item) => (
                <li key={item.slice(0, 40)}>
                  <CheckCircle2 className="abroad-guide__check-icon" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="abroad-guide__panel" id="mbbs-abroad-choosing" aria-labelledby="choosing-title">
            <h3 id="choosing-title" className="abroad-guide__h3 abroad-guide__h3--in-panel">
              How to choose the right university
            </h3>
            <ul className="abroad-guide__checklist">
              {MBBS_ABROAD_HUB.choosingCollegeTips.map((item) => (
                <li key={item.slice(0, 40)}>
                  <CheckCircle2 className="abroad-guide__check-icon" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section className="abroad-guide__block" id="mbbs-abroad-licensing" aria-labelledby="licensing-title">
          <h3 id="licensing-title" className="abroad-guide__h3">
            Practice in India after MBBS abroad
          </h3>
          <p className="abroad-guide__p">{MBBS_ABROAD_HUB.licensingNote}</p>
        </section>

        <section className="abroad-guide__block" id="mbbs-abroad-ar-group" aria-labelledby="ar-group-title">
          <h3 id="ar-group-title" className="abroad-guide__h3">
            Why students trust AR Group of Education
          </h3>
          <ul className="abroad-guide__checklist abroad-guide__checklist--grid">
            {MBBS_ABROAD_HUB.whyArGroup.map((item) => (
              <li key={item.slice(0, 36)}>
                <CheckCircle2 className="abroad-guide__check-icon" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <div
          className="abroad-guide__bento abroad-guide__bento--elig"
          id="mbbs-abroad-eligibility"
        >
          <div className="abroad-guide__panel abroad-guide__panel--accent" aria-labelledby="eligibility-title">
            <h3 id="eligibility-title" className="abroad-guide__h3 abroad-guide__h3--in-panel">
              Eligibility for MBBS abroad
            </h3>
            <ul className="abroad-guide__checklist">
              {MBBS_ABROAD_HUB.eligibility.map((item) => (
                <li key={item.slice(0, 36)}>
                  <CheckCircle2 className="abroad-guide__check-icon" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="abroad-guide__panel" id="mbbs-abroad-benefits" aria-labelledby="benefits-title">
            <h3 id="benefits-title" className="abroad-guide__h3 abroad-guide__h3--in-panel">
              Why students choose MBBS abroad
            </h3>
            <ul className="abroad-guide__benefits abroad-guide__benefits--dense">
              {MBBS_ABROAD_HUB.benefits.map((b) => (
                <li key={b.title}>
                  <strong>{b.title}</strong>
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section className="abroad-guide__block abroad-guide__block--process" id="mbbs-abroad-process" aria-labelledby="process-title">
          <h3 id="process-title" className="abroad-guide__h3">
            Admission procedure, step by step
          </h3>
          <ol className="abroad-guide__steps">
            {MBBS_ABROAD_HUB.process.map((s) => (
              <li key={s.step}>
                <span className="abroad-guide__step-num">{s.step}</span>
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="abroad-guide__cta-inline">
            <Link href="/contact" className="program-hub-btn-primary program-hub-btn-primary--lg">
              Start expert counselling
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </p>
        </section>

        <section className="abroad-guide__block" id="mbbs-abroad-faq" aria-labelledby="faq-title">
          <h3 id="faq-title" className="abroad-guide__h3">
            Frequently asked questions
          </h3>
          <div className="abroad-guide__faqs">
            {MBBS_ABROAD_HUB.faqs.map((faq, i) => (
              <details key={faq.question} className="abroad-guide__faq" open={i === 0}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="sr-only">
          Official page URL: {SITE_URL}/mbbs-abroad, study MBBS abroad universities directory by AR Group
          of Education.
        </p>
      </div>
    </section>
  );
}
