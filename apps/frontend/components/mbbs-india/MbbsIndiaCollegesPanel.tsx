'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import { NavMegaMenuShell } from '@/components/common/NavMegaMenuShell';
import { MBBS_INDIA_STATES, type MbbsIndiaStateColleges } from '@/lib/mbbsIndiaTree';

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

  const resetHovered = () =>
    setHovered(MBBS_INDIA_STATES.find((s) => s.id === initialStateId) ?? MBBS_INDIA_STATES[0]);

  const rail = (
    <ul className={isNav ? 'nav-mega-rail' : 'w-full max-w-xs shrink-0 border-r border-slate-100 bg-gradient-to-b from-slate-50 to-white py-2 md:w-56'}>
      {MBBS_INDIA_STATES.map((state) => {
        const active = hovered.id === state.id;
        return (
          <li key={state.id}>
            <Link
              href={state.href}
              onMouseEnter={() => setHovered(state)}
              onFocus={() => setHovered(state)}
              onClick={onNavigate}
              className={
                isNav
                  ? `nav-mega-rail-item ${active ? 'nav-mega-rail-item--active' : ''}`
                  : [
                      'group/state flex items-center justify-between gap-2 px-3 py-2.5 text-[13px] leading-snug transition-colors',
                      active
                        ? 'border-l-[3px] border-gold-500 bg-white font-semibold text-navy-900 shadow-sm'
                        : 'border-l-[3px] border-transparent text-slate-700 hover:bg-white/90 hover:text-navy-900',
                    ].join(' ')
              }
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
  );

  const collegesPanel = (
    <div
      className={
        isNav
          ? 'nav-mega-panel'
          : [
              'flex-1 bg-white py-3 px-1',
              useTwoColumns ? 'min-w-[26rem] max-w-[36rem]' : 'min-w-[18rem] max-w-[28rem]',
            ].join(' ')
      }
    >
      <div className={isNav ? 'nav-mega-panel-head' : 'mb-2 flex items-center justify-between px-3'}>
        <p className={isNav ? 'nav-mega-panel-kicker' : 'text-[11px] font-semibold uppercase tracking-wider text-slate-500'}>
          {hovered.name} · {hovered.colleges.length} colleges
        </p>
        <Link
          href={hovered.href}
          onClick={onNavigate}
          className={isNav ? 'nav-mega-panel-link' : 'text-[11px] font-semibold text-gold-700 hover:underline'}
        >
          View state →
        </Link>
      </div>
      <ul
        className={[
          isNav ? 'nav-mega-colleges' : 'max-h-[22rem] overflow-y-auto px-1',
          useTwoColumns ? (isNav ? 'nav-mega-colleges--grid-2' : 'grid grid-cols-1 gap-x-1 sm:grid-cols-2') : '',
        ].join(' ')}
      >
        {hovered.colleges.map((college, index) => (
          <li key={`${hovered.id}-${college.name}-${index}`}>
            {isNav ? (
              <Link href={college.href} onClick={onNavigate} className="nav-mega-college-link group">
                <span className="min-w-0">
                  <span className="nav-mega-college-name">{college.name}</span>
                  {college.city ? <span className="nav-mega-college-city">{college.city}</span> : null}
                </span>
                <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-gold-500" />
              </Link>
            ) : (
              <Link
                href={college.href}
                className="group flex items-start justify-between gap-2 rounded-xl px-2.5 py-2 transition hover:bg-slate-50/90"
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium leading-snug text-navy-900 group-hover:text-gold-700">
                    {college.name}
                  </span>
                  {college.city ? (
                    <span className="mt-0.5 block text-xs text-slate-500">{college.city}</span>
                  ) : null}
                </span>
                <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-gold-500" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  if (isNav) {
    return (
      <NavMegaMenuShell
        theme="india"
        title="MBBS in India"
        description="Browse state-wise medical colleges — NEET counselling, fees & admission guidance."
        hubHref="/mbbs-india"
        hubLabel="All states"
        footerHref="/mbbs-india"
        footerLabel="View all states →"
        onNavigate={onNavigate}
        className="mbbs-india-mega-menu"
      >
        <div className="nav-mega-body" onMouseLeave={resetHovered}>
          {rail}
          {collegesPanel}
        </div>
      </NavMegaMenuShell>
    );
  }

  return (
    <div
      className="flex overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 shadow-xl backdrop-blur-sm"
      onMouseLeave={resetHovered}
    >
      {rail}
      {collegesPanel}
    </div>
  );
}
