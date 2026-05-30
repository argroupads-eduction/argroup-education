'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import { NavMegaMenuShell } from '@/components/common/NavMegaMenuShell';
import {
  MBBS_ABROAD_COUNTRIES,
  isMbbsAbroadThreeLevel,
  mbbsAbroadCountryHref,
  type MbbsAbroadCountryColleges,
  type MbbsAbroadUniversity,
} from '@/lib/mbbsAbroadTree';

type MbbsAbroadCollegesPanelProps = {
  onNavigate?: () => void;
  layout?: 'nav' | 'section';
  initialCountryId?: string;
};

function firstUniversity(country: MbbsAbroadCountryColleges): MbbsAbroadUniversity | undefined {
  return country.universities?.[0];
}

export function MbbsAbroadCollegesPanel({
  onNavigate,
  layout = 'nav',
  initialCountryId,
}: MbbsAbroadCollegesPanelProps) {
  const [hoveredCountry, setHoveredCountry] = useState<MbbsAbroadCountryColleges>(
    MBBS_ABROAD_COUNTRIES.find((c) => c.id === initialCountryId) ?? MBBS_ABROAD_COUNTRIES[0]
  );
  const [hoveredUniversity, setHoveredUniversity] = useState<MbbsAbroadUniversity | undefined>(
    () => firstUniversity(MBBS_ABROAD_COUNTRIES.find((c) => c.id === initialCountryId) ?? MBBS_ABROAD_COUNTRIES[0])
  );

  const threeLevel = isMbbsAbroadThreeLevel(hoveredCountry);
  const isNav = layout === 'nav';

  const rightColleges = useMemo(() => {
    if (threeLevel && hoveredUniversity?.colleges?.length) return hoveredUniversity.colleges;
    return hoveredCountry.colleges ?? [];
  }, [hoveredCountry, hoveredUniversity, threeLevel]);

  const useTwoColumns = rightColleges.length > 8;

  const handleCountryEnter = (country: MbbsAbroadCountryColleges) => {
    setHoveredCountry(country);
    setHoveredUniversity(isMbbsAbroadThreeLevel(country) ? firstUniversity(country) : undefined);
  };

  const handleMenuLeave = () => {
    const first = MBBS_ABROAD_COUNTRIES.find((c) => c.id === initialCountryId) ?? MBBS_ABROAD_COUNTRIES[0];
    setHoveredCountry(first);
    setHoveredUniversity(firstUniversity(first));
  };

  const railItemClass = (active: boolean) =>
    isNav
      ? `nav-mega-rail-item ${active ? 'nav-mega-rail-item--active' : ''}`
      : [
          'group/item flex items-center justify-between gap-2 px-3 py-2.5 text-[13px] leading-snug transition-colors',
          active
            ? 'border-l-[3px] border-gold-500 bg-white font-semibold text-navy-900 shadow-sm'
            : 'border-l-[3px] border-transparent text-slate-700 hover:bg-white/90 hover:text-navy-900',
        ].join(' ');

  const countryRail = (
    <ul className={isNav ? 'nav-mega-rail' : 'w-[13.5rem] shrink-0 overflow-y-auto border-r border-slate-100 bg-slate-50/80 py-2'}>
      {MBBS_ABROAD_COUNTRIES.map((country) => {
        const active = hoveredCountry.id === country.id;
        return (
          <li key={country.id}>
            <Link
              href={mbbsAbroadCountryHref(country.id)}
              onMouseEnter={() => handleCountryEnter(country)}
              onFocus={() => handleCountryEnter(country)}
              onClick={onNavigate}
              className={railItemClass(active)}
            >
              <span className="line-clamp-2">MBBS in {country.name}</span>
              <ChevronRight
                className={`h-3.5 w-3.5 shrink-0 ${active ? 'translate-x-0.5 text-gold-600' : 'text-slate-400'}`}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const universityRail =
    threeLevel && hoveredCountry.universities ? (
      <ul
        className={
          isNav
            ? 'nav-mega-rail !w-[15rem]'
            : 'w-[15rem] shrink-0 overflow-y-auto border-r border-slate-100 bg-white py-2'
        }
      >
        {hoveredCountry.universities.map((university) => {
          const active = hoveredUniversity?.id === university.id;
          return (
            <li key={university.id}>
              <Link
                href={university.href}
                onMouseEnter={() => setHoveredUniversity(university)}
                onFocus={() => setHoveredUniversity(university)}
                onClick={onNavigate}
                className={railItemClass(active)}
              >
                <span className="line-clamp-3">{university.name}</span>
                {university.colleges?.length ? (
                  <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-gold-600' : 'text-slate-400'}`} />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    ) : null;

  const collegesPanel = (
    <div
      className={
        isNav
          ? 'nav-mega-panel min-w-[18rem]'
          : ['flex min-w-[18rem] flex-1 flex-col bg-white py-3 px-1', useTwoColumns ? 'max-w-[36rem]' : 'max-w-[28rem]'].join(
              ' '
            )
      }
    >
      <div className={isNav ? 'nav-mega-panel-head' : 'mb-2 flex items-center justify-between px-3'}>
        <p className={isNav ? 'nav-mega-panel-kicker' : 'text-[11px] font-semibold uppercase tracking-wider text-slate-500'}>
          {threeLevel ? hoveredUniversity?.name ?? hoveredCountry.name : hoveredCountry.name} ·{' '}
          {rightColleges.length} colleges
        </p>
        <Link
          href={hoveredCountry.href}
          onClick={onNavigate}
          className={isNav ? 'nav-mega-panel-link' : 'text-[11px] font-semibold text-gold-700 hover:underline'}
        >
          View country →
        </Link>
      </div>
      {rightColleges.length ? (
        <ul
          className={[
            isNav ? 'nav-mega-colleges' : 'max-h-[22rem] overflow-y-auto px-1',
            useTwoColumns ? (isNav ? 'nav-mega-colleges--grid-2' : 'grid sm:grid-cols-2') : '',
          ].join(' ')}
        >
          {rightColleges.map((college, index) => (
            <li key={`${hoveredCountry.id}-${college.name}-${index}`}>
              <Link href={college.href} onClick={onNavigate} className="nav-mega-college-link group">
                <span className="min-w-0">
                  <span className="nav-mega-college-name">{college.name}</span>
                </span>
                <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-gold-500" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 items-center justify-center px-4 text-sm text-slate-500">
          {hoveredUniversity ? (
            <Link href={hoveredUniversity.href} className="font-medium text-navy-900 hover:text-gold-600">
              View {hoveredUniversity.name}
            </Link>
          ) : (
            'Explore country page for details'
          )}
        </div>
      )}
    </div>
  );

  const sectionBody = (
    <>
      {countryRail}
      {universityRail}
      {collegesPanel}
    </>
  );

  if (isNav) {
    return (
      <NavMegaMenuShell
        theme="abroad"
        title="MBBS Abroad"
        description="Explore countries, universities & colleges — fees, eligibility & visa guidance."
        hubHref="/mbbs-abroad"
        hubLabel="All countries"
        footerHref="/mbbs-abroad"
        footerLabel="View all countries →"
        onNavigate={onNavigate}
      >
        <div className="nav-mega-body mbbs-abroad-mega-menu" onMouseLeave={handleMenuLeave}>
          {sectionBody}
        </div>
      </NavMegaMenuShell>
    );
  }

  return (
    <div
      className="flex max-h-[min(32rem,calc(100dvh-6rem))] overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 shadow-xl backdrop-blur-sm"
      onMouseLeave={handleMenuLeave}
    >
      {sectionBody}
    </div>
  );
}
