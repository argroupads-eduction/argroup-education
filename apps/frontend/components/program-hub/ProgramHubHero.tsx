import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { ContentBreadcrumbs, type BreadcrumbItem } from '@/components/content/ContentBreadcrumbs';
import type { ProgramHubTheme } from '@/lib/programHubContent';

type ProgramHubHeroProps = {
  theme: ProgramHubTheme;
  badge: string;
  title: ReactNode;
  lead: string;
  stats: { label: string; value: string }[];
  breadcrumbs?: BreadcrumbItem[];
};

export function ProgramHubHero({ theme, badge, title, lead, stats, breadcrumbs }: ProgramHubHeroProps) {
  return (
    <section className={`program-hub-hero program-hub-hero--${theme}`}>
      <div className="program-hub-hero__mesh" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4">
        {breadcrumbs?.length ? (
          <div className="mb-5">
            <ContentBreadcrumbs items={breadcrumbs} variant="dark" />
          </div>
        ) : null}
        <span className="program-hub-eyebrow">{badge}</span>
        <h1 className="program-hub-title">{title}</h1>
        <p className="program-hub-lead">{lead}</p>
        <dl className="program-hub-stats">
          {stats.map((s) => (
            <div key={s.label} className="program-hub-stat">
              <dt className="program-hub-stat-label">{s.label}</dt>
              <dd className="program-hub-stat-value">{s.value}</dd>
            </div>
          ))}
        </dl>
        <div className="program-hub-actions">
          <Link href="/contact" className="program-hub-btn-primary">
            Free counselling
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <a href="tel:+917076909090" className="program-hub-btn-ghost">
            Call +91-7076909090
          </a>
        </div>
      </div>
    </section>
  );
}
