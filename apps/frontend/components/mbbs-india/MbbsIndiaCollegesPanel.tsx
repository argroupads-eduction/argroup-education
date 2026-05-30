'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, GraduationCap } from 'lucide-react';
import { MBBS_INDIA_STATES, type MbbsIndiaStateColleges } from '@/lib/mbbsIndiaTree';
import { CollegeCard } from './CollegeCard';

type MbbsIndiaCollegesPanelProps = {
  onNavigate?: () => void;
  /** `nav` = navbar mega menu, `section` = home / state pages */
  layout?: 'nav' | 'section';
  initialStateId?: string;
};

export function MbbsIndiaCollegesPanel({
  onNavigate,
  layout = 'nav',
  initialStateId,
}: MbbsIndiaCollegesPanelProps) {
  const [hovered, setHovered] = useState<MbbsIndiaStateColleges>(
    MBBS_INDIA_STATES.find((s) => s.id === initialStateId) ?? MBBS_INDIA_STATES[0]
  );

  const useTwoColumns = hovered.colleges.length > 8;
  const isNav = layout === 'nav';

  return (
    <div
      className={[
        'flex overflow-hidden',
        isNav
          ? 'mbbs-india-mega-menu rounded-xl border border-slate-200/80 bg-white shadow-2xl ring-1 ring-black/5'
          : 'rounded-3xl border border-slate-200/70 bg-white/90 shadow-xl backdrop-blur-sm',
      ].join(' ')}
      onMouseLeave={() =>
        setHovered(MBBS_INDIA_STATES.find((s) => s.id === initialStateId) ?? MBBS_INDIA_STATES[0])
      }
    >
      <ul
        className={[
          'shrink-0 border-r border-slate-100 bg-gradient-to-b from-slate-50 to-white py-2',
          isNav ? 'w-[13.5rem]' : 'w-full max-w-xs md:w-56',
        ].join(' ')}
      >
        {MBBS_INDIA_STATES.map((state) => {
          const active = hovered.id === state.id;
          return (
            <li key={state.id}>
              <Link
                href={state.href}
                onMouseEnter={() => setHovered(state)}
                onFocus={() => setHovered(state)}
                onClick={onNavigate}
                className={[
                  'group/state flex items-center justify-between gap-2 px-3 py-2.5 text-[13px] leading-snug transition-colors',
                  active
                    ? 'border-l-[3px] border-gold-500 bg-white font-semibold text-navy-900 shadow-sm'
                    : 'border-l-[3px] border-transparent text-slate-700 hover:bg-white/90 hover:text-navy-900',
                ].join(' ')}
              >
                <span className="line-clamp-2">MBBS in {state.name}</span>
                <ChevronRight
                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                    active ? 'translate-x-0.5 text-gold-600' : 'text-slate-400 group-hover/state:text-slate-600'
                  }`}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>

      <div
        className={[
          'flex-1 bg-white py-3 px-1',
          useTwoColumns ? 'min-w-[26rem] max-w-[36rem]' : 'min-w-[18rem] max-w-[28rem]',
        ].join(' ')}
      >
        <div className="mb-2 flex items-center justify-between px-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {hovered.name} · {hovered.colleges.length} colleges
          </p>
          <Link
            href={hovered.href}
            onClick={onNavigate}
            className="text-[11px] font-semibold text-gold-700 hover:underline"
          >
            View state →
          </Link>
        </div>
        <ul
          className={[
            'max-h-[22rem] overflow-y-auto px-1',
            useTwoColumns ? 'grid grid-cols-1 gap-x-1 sm:grid-cols-2' : '',
          ].join(' ')}
        >
          {hovered.colleges.map((college, index) => (
            <li key={`${hovered.id}-${college.name}-${index}`}>
              <CollegeCard college={college} variant="compact" />
            </li>
          ))}
        </ul>
        {!isNav && (
          <div className="mt-3 border-t border-slate-100 px-3 pt-3">
            <Link
              href={hovered.href}
              className="inline-flex items-center gap-2 text-sm font-semibold text-navy-900 hover:text-gold-700"
            >
              <GraduationCap className="h-4 w-4" />
              Explore all {hovered.colleges.length} colleges in {hovered.name}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
