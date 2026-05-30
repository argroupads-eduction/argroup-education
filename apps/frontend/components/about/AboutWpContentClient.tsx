'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Phone } from 'lucide-react';
import type { ContentHeading, QuickFact } from '@/lib/wpContentStructure';
import { WpFaqEnhancer } from '@/components/content/WpFaqEnhancer';
import { WpLazyReveal } from '@/components/content/WpLazyReveal';
import { QuickFactsGrid } from '@/components/content/QuickFactsGrid';

type AboutWpContentClientProps = {
  html: string;
  headings: ContentHeading[];
  quickFacts: QuickFact[];
  title: string;
};

function splitHtmlByH2(html: string): { id: string; title: string; html: string }[] {
  const parts = html.split(/(?=<h2[\s>])/i).filter(Boolean);
  if (parts.length <= 1) {
    return [{ id: 'about-content', title: 'Details', html }];
  }

  return parts.map((chunk, i) => {
    const titleMatch = chunk.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const titleText = titleMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || `Section ${i + 1}`;
    const idMatch = chunk.match(/<h2[^>]*\sid=["']([^"']+)["']/i);
    const id = idMatch?.[1] || `about-section-${i + 1}`;
    return { id, title: titleText, html: chunk };
  });
}

export function AboutWpContentClient({
  html,
  headings,
  quickFacts,
}: AboutWpContentClientProps) {
  const sections = useMemo(() => splitHtmlByH2(html), [html]);
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '');
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(sections.slice(0, 2).map((s) => s.id)));

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const scrollTo = (id: string) => {
    setActiveId(id);
    setOpenIds((prev) => new Set(prev).add(id));
    document.getElementById(`about-acc-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!html.trim()) return null;

  return (
    <section className="about-wp" aria-label="Extended about information">
      <div className="about-wp__header">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="about-kicker">Know us deeper</p>
          <h2 className="about-heading">What makes AR Group different</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
            Tap a topic below — curated from our official profile, without the clutter of a generic content page.
          </p>
        </div>

        {headings.length > 1 ? (
          <div className="about-wp__pills-wrap mx-auto mt-8 max-w-5xl px-4">
            <div className="about-wp__pills" role="tablist" aria-label="About sections">
              {headings.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  role="tab"
                  aria-selected={activeId === h.id}
                  className={[
                    'about-wp__pill',
                    activeId === h.id ? 'about-wp__pill--active' : '',
                  ].join(' ')}
                  onClick={() => scrollTo(h.id)}
                >
                  {h.text.length > 42 ? `${h.text.slice(0, 40)}…` : h.text}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 md:pb-20">
        <QuickFactsGrid facts={quickFacts} />

        <div className="about-wp__accordion">
          {sections.map((section, i) => {
            const isOpen = openIds.has(section.id);
            return (
              <article
                key={section.id}
                id={`about-acc-${section.id}`}
                className={['about-wp__panel', isOpen ? 'about-wp__panel--open' : ''].join(' ')}
              >
                <button
                  type="button"
                  className="about-wp__panel-trigger"
                  aria-expanded={isOpen}
                  onClick={() => {
                    toggle(section.id);
                    setActiveId(section.id);
                  }}
                >
                  <span className="about-wp__panel-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="about-wp__panel-title">{section.title}</span>
                  <ChevronDown
                    className={[
                      'about-wp__panel-chevron h-5 w-5 shrink-0',
                      isOpen ? 'about-wp__panel-chevron--open' : '',
                    ].join(' ')}
                    aria-hidden
                  />
                </button>
                {isOpen ? (
                  <div className="about-wp__panel-body">
                    <WpLazyReveal />
                    <WpFaqEnhancer />
                    <div
                      className="wp-content wp-content-body about-wp__html"
                      dangerouslySetInnerHTML={{ __html: section.html }}
                    />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        <div className="about-wp__inline-cta mt-8">
          <p className="text-sm font-semibold text-navy-900">Questions after reading?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-navy-800"
            >
              Book counselling
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="tel:+917076909090"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-navy-900 transition hover:border-gold-400"
            >
              <Phone className="h-4 w-4" />
              Call counsellor
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
