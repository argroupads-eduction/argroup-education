'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import {
  MBBS_ABROAD_COUNTRIES,
  isMbbsAbroadThreeLevel,
  mbbsAbroadCollegeHref,
  mbbsAbroadCountryHref,
  type MbbsAbroadCountryColleges,
  type MbbsAbroadUniversity,
} from '@/lib/mbbsAbroadCollegesByCountry'

type MbbsAbroadNavMegaMenuProps = {
  onNavigate?: () => void
}

function firstUniversity(country: MbbsAbroadCountryColleges): MbbsAbroadUniversity | undefined {
  return country.universities?.[0]
}

function universityHasColleges(university: MbbsAbroadUniversity): boolean {
  return Boolean(university.colleges?.length)
}

export function MbbsAbroadNavMegaMenu({ onNavigate }: MbbsAbroadNavMegaMenuProps) {
  const [hoveredCountry, setHoveredCountry] = useState<MbbsAbroadCountryColleges>(
    MBBS_ABROAD_COUNTRIES[0]
  )
  const [hoveredUniversity, setHoveredUniversity] = useState<MbbsAbroadUniversity | undefined>(
    () => firstUniversity(MBBS_ABROAD_COUNTRIES[0])
  )

  const threeLevel = isMbbsAbroadThreeLevel(hoveredCountry)

  const rightColleges = useMemo(() => {
    if (threeLevel && hoveredUniversity?.colleges?.length) {
      return hoveredUniversity.colleges
    }
    return hoveredCountry.colleges ?? []
  }, [hoveredCountry.colleges, hoveredUniversity, threeLevel])

  const useTwoColumns = rightColleges.length > 8

  const handleCountryEnter = (country: MbbsAbroadCountryColleges) => {
    setHoveredCountry(country)
    if (isMbbsAbroadThreeLevel(country)) {
      setHoveredUniversity(firstUniversity(country))
    } else {
      setHoveredUniversity(undefined)
    }
  }

  const handleMenuLeave = () => {
    const first = MBBS_ABROAD_COUNTRIES[0]
    setHoveredCountry(first)
    setHoveredUniversity(firstUniversity(first))
  }

  const rightTitle = threeLevel
    ? (hoveredUniversity?.name ?? hoveredCountry.name)
    : hoveredCountry.name

  const rightCount = threeLevel
    ? (hoveredUniversity?.colleges?.length ?? 0)
    : (hoveredCountry.colleges?.length ?? 0)

  const showRightPanel =
    threeLevel && hoveredUniversity
      ? universityHasColleges(hoveredUniversity)
      : (hoveredCountry.colleges?.length ?? 0) > 0

  const activeLinkClass = (active: boolean) =>
    [
      'mega-menu-state-link group/item flex items-center justify-between gap-2 px-3 py-2.5 text-[13px] leading-snug transition-colors',
      active
        ? 'border-l-[3px] border-gold-500 bg-white font-semibold text-navy-900 shadow-sm'
        : 'border-l-[3px] border-transparent text-slate-700 hover:bg-white/90 hover:text-navy-900',
    ].join(' ')

  return (
    <div
      className="mbbs-abroad-mega-menu flex max-h-[min(32rem,calc(100dvh-6rem))] overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xl ring-1 ring-black/5"
      onMouseLeave={handleMenuLeave}
    >
      <ul className="w-[13.5rem] shrink-0 overflow-y-auto border-r border-slate-100 bg-slate-50/80 py-2">
        {MBBS_ABROAD_COUNTRIES.map((country) => {
          const active = hoveredCountry.id === country.id
          const hasChevron =
            isMbbsAbroadThreeLevel(country) || (country.colleges?.length ?? 0) > 0
          return (
            <li key={country.id}>
              <Link
                href={mbbsAbroadCountryHref(country.id)}
                onMouseEnter={() => handleCountryEnter(country)}
                onFocus={() => handleCountryEnter(country)}
                onClick={onNavigate}
                className={activeLinkClass(active)}
              >
                <span className="line-clamp-2">MBBS in {country.name}</span>
                {hasChevron ? (
                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                      active
                        ? 'translate-x-0.5 text-gold-600'
                        : 'text-slate-400 group-hover/item:text-slate-600'
                    }`}
                    aria-hidden
                  />
                ) : (
                  <span className="h-3.5 w-3.5 shrink-0" aria-hidden />
                )}
              </Link>
            </li>
          )
        })}
      </ul>

      {threeLevel && hoveredCountry.universities ? (
        <ul className="w-[15rem] shrink-0 overflow-y-auto border-r border-slate-100 bg-white py-2">
          {hoveredCountry.universities.map((university) => {
            const active = hoveredUniversity?.id === university.id
            const hasSubColleges = universityHasColleges(university)
            return (
              <li key={university.id}>
                <Link
                  href={university.href}
                  onMouseEnter={() => setHoveredUniversity(university)}
                  onFocus={() => setHoveredUniversity(university)}
                  onClick={onNavigate}
                  className={activeLinkClass(active)}
                >
                  <span className="line-clamp-3">{university.name}</span>
                  {hasSubColleges ? (
                    <ChevronRight
                      className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                        active
                          ? 'translate-x-0.5 text-gold-600'
                          : 'text-slate-400 group-hover/item:text-slate-600'
                      }`}
                      aria-hidden
                    />
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      ) : null}

      {showRightPanel ? (
        <div
          className={[
            'flex min-w-[18rem] max-w-[28rem] flex-1 flex-col overflow-hidden bg-white py-3 px-1',
            useTwoColumns ? 'sm:min-w-[26rem] sm:max-w-[36rem]' : '',
          ].join(' ')}
        >
          <p className="mb-2 shrink-0 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {rightTitle} · {rightCount} colleges
          </p>
          <ul
            className={[
              'min-h-0 flex-1 overflow-y-auto px-1',
              useTwoColumns ? 'grid grid-cols-1 gap-x-1 gap-y-0 sm:grid-cols-2' : '',
            ].join(' ')}
          >
            {rightColleges.map((collegeItem, index) => (
              <li key={`${hoveredCountry.id}-${collegeItem.name}-${index}`}>
                <Link
                  href={mbbsAbroadCollegeHref(hoveredCountry.id)}
                  onClick={onNavigate}
                  className="mega-menu-college-link block rounded-md px-3 py-2 text-[13px] leading-snug text-navy-900 transition-colors hover:bg-slate-50"
                >
                  <span className="font-medium">{collegeItem.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex min-w-[14rem] flex-1 items-center justify-center bg-white px-6 py-8 text-center text-sm text-slate-500">
          {threeLevel && hoveredUniversity ? (
            <Link
              href={hoveredUniversity.href}
              onClick={onNavigate}
              className="mega-menu-college-link font-medium text-navy-900 hover:text-gold-600"
            >
              View {hoveredUniversity.name}
            </Link>
          ) : (
            <span>No colleges listed yet.</span>
          )}
        </div>
      )}
    </div>
  )
}
