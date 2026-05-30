import Link from 'next/link';
import { FitImage } from '@/components/ui/FitImage';
import { ArrowRight, Phone } from 'lucide-react';
import { ContentBreadcrumbs, type BreadcrumbItem } from './ContentBreadcrumbs';

type ProgramTheme = 'india' | 'abroad' | 'mdms' | 'default';

type ProgramPageHeroProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  breadcrumbs: BreadcrumbItem[];
  theme?: ProgramTheme;
  stats?: { label: string; value: string }[];
  featuredImage?: string | null;
};

const THEME_STYLES: Record<ProgramTheme, string> = {
  india: 'bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900',
  abroad: 'bg-gradient-to-br from-blue-950 via-navy-900 to-blue-900',
  mdms: 'bg-gradient-to-br from-indigo-950 via-navy-900 to-indigo-900',
  default: 'bg-gradient-to-br from-slate-900 via-navy-900 to-slate-800',
};

export function ProgramPageHero({
  title,
  subtitle,
  badge,
  breadcrumbs,
  theme = 'default',
  stats,
  featuredImage,
}: ProgramPageHeroProps) {
  return (
    <section className={`relative overflow-hidden py-8 sm:py-10 md:py-14 ${THEME_STYLES[theme]}`}>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.16),transparent_55%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-3 sm:px-4">
        <div className={featuredImage ? 'grid items-center gap-6 sm:gap-8 lg:grid-cols-[1.1fr_0.9fr]' : ''}>
          <div className="min-w-0">
            <ContentBreadcrumbs items={breadcrumbs} variant="dark" />
            {badge ? (
              <span className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-gold-300 backdrop-blur-sm">
                {badge}
              </span>
            ) : null}
            <h1 className="max-w-4xl font-serif text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl lg:text-[2.75rem]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-blue-100/90 md:text-lg">{subtitle}</p>
            ) : null}
            {stats?.length ? (
              <dl className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-sm"
                  >
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-gold-300/90">{s.label}</dt>
                    <dd className="mt-0.5 text-base font-bold text-white">{s.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <div className="mt-5 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:gap-3">
              <Link
                href="/contact"
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-gold-500 px-6 py-3 text-sm font-bold text-navy-900 transition hover:bg-gold-400 sm:w-auto"
              >
                Free counselling
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="tel:+917076909090"
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 sm:w-auto"
              >
                <Phone className="h-4 w-4" />
                +91-7076909090
              </a>
            </div>
          </div>

          {featuredImage ? (
            <div className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 shadow-2xl lg:max-w-none">
              <FitImage
                src={featuredImage}
                alt={title}
                priority
                maxHeight="20rem"
                frameClassName="rounded-2xl bg-navy-950/40"
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
