import { Sparkles } from 'lucide-react';
import type { QuickFact } from '@/lib/wpContentStructure';

type QuickFactsGridProps = {
  facts: QuickFact[];
  title?: string;
};

export function QuickFactsGrid({ facts, title = 'Key highlights at a glance' }: QuickFactsGridProps) {
  if (!facts.length) return null;

  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-gold-200/50 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 shadow-xl sm:mb-10 sm:rounded-2xl">
      <div className="border-b border-white/10 px-4 py-3.5 sm:px-5 sm:py-4 md:px-6">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-gold-300">
          <Sparkles className="h-4 w-4" aria-hidden />
          {title}
        </p>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {facts.map((fact) => (
          <div
            key={`${fact.label}-${fact.value}`}
            className="border-b border-r border-white/10 px-4 py-3.5 sm:px-5 sm:py-4 md:px-6"
          >
            <dt className="text-[11px] font-bold uppercase tracking-wider text-gold-300/90">{fact.label}</dt>
            <dd className="mt-1.5 text-sm font-semibold leading-snug text-white md:text-[0.9375rem]">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
