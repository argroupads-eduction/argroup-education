import Link from 'next/link';
import { CollegeCard } from './CollegeCard';
import { HorizontalScrollItem, HorizontalScrollRow } from '@/components/ui/HorizontalScrollRow';
import type { MbbsIndiaStateColleges } from '@/lib/mbbsIndiaTree';

type MbbsIndiaStateGridProps = {
  state: MbbsIndiaStateColleges;
};

export function MbbsIndiaStateGrid({ state }: MbbsIndiaStateGridProps) {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-gold-600">Medical colleges</p>
          <h2 className="mt-2 text-2xl font-bold text-navy-900 md:text-3xl">
            {state.colleges.length} MBBS colleges in {state.name}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
            Select a college for fees, eligibility, cut-offs, and admission guidance.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex shrink-0 items-center rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800"
        >
          Free counselling
        </Link>
      </div>

      <HorizontalScrollRow ariaLabel={`${state.name} colleges`} gapClassName="gap-4">
        {state.colleges.map((college, index) => (
          <HorizontalScrollItem
            key={`${state.id}-${college.name}-${index}`}
            className="w-[17.5rem] sm:w-[19rem] md:w-[20rem]"
          >
            <CollegeCard
              college={college}
              index={index}
              variant={index < 2 ? 'featured' : 'default'}
            />
          </HorizontalScrollItem>
        ))}
      </HorizontalScrollRow>
    </div>
  );
}
