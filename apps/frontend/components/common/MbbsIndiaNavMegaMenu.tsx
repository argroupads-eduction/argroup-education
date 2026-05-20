'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import {
  MBBS_INDIA_STATES,
  mbbsIndiaStateHomeHash,
  type MbbsIndiaStateColleges,
} from '@/lib/mbbsIndiaCollegesByState'

type MbbsIndiaNavMegaMenuProps = {
  onNavigate?: () => void
}

export function MbbsIndiaNavMegaMenu({ onNavigate }: MbbsIndiaNavMegaMenuProps) {
  const [hovered, setHovered] = useState<MbbsIndiaStateColleges>(MBBS_INDIA_STATES[0])

  const useTwoColumns = hovered.colleges.length > 8

  return (
    <div
      className="mbbs-india-mega-menu flex max-h-[min(32rem,calc(100dvh-6rem))] overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xl ring-1 ring-black/5"
      onMouseLeave={() => setHovered(MBBS_INDIA_STATES[0])}
    >
      {/* States — scrollable on short viewports */}
      <ul className="w-[13.5rem] shrink-0 overflow-y-auto border-r border-slate-100 bg-slate-50/80 py-2">
        {MBBS_INDIA_STATES.map((state) => {
          const active = hovered.id === state.id
          return (
            <li key={state.id}>
              <Link
                href={mbbsIndiaStateHomeHash(state.id)}
                onMouseEnter={() => setHovered(state)}
                onFocus={() => setHovered(state)}
                onClick={onNavigate}
                className={[
                  'mega-menu-state-link group/state flex items-center justify-between gap-2 px-3 py-2.5 text-[13px] leading-snug transition-colors',
                  active
                    ? 'border-l-[3px] border-gold-500 bg-white font-semibold text-navy-900 shadow-sm'
                    : 'border-l-[3px] border-transparent text-slate-700 hover:bg-white/90 hover:text-navy-900',
                ].join(' ')}
              >
                <span className="line-clamp-2">MBBS in {state.name}</span>
                <ChevronRight
                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                    active ? 'text-gold-600 translate-x-0.5' : 'text-slate-400 group-hover/state:text-slate-600'
                  }`}
                  aria-hidden
                />
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Colleges — natural height, optional 2 columns for long lists */}
      <div
        className={[
          'min-w-0 min-h-0 max-w-[28rem] flex-1 overflow-y-auto bg-white py-3 px-1 sm:min-w-[18rem]',
          useTwoColumns ? 'sm:min-w-[26rem] sm:max-w-[36rem]' : '',
        ].join(' ')}
      >
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {hovered.name} · {hovered.colleges.length} colleges
        </p>
        <ul
          className={[
            'px-1',
            useTwoColumns ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-1 gap-y-0' : '',
          ].join(' ')}
        >
          {hovered.colleges.map((college, index) => (
            <li key={`${hovered.id}-${college.name}-${index}`}>
              <Link
                href={mbbsIndiaStateHomeHash(hovered.id)}
                onClick={onNavigate}
                className="mega-menu-college-link block rounded-md px-3 py-2 text-[13px] leading-snug text-navy-900 transition-colors hover:bg-slate-50"
              >
                <span className="font-medium">{college.name}</span>
                {college.city ? (
                  <span className="mt-0.5 block text-xs text-slate-500">{college.city}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
