'use client'

import Link from 'next/link'
import { MBBS_INDIA_STATES } from '@/lib/mbbsIndiaCollegesByState'
import { FooterAccordion } from './FooterAccordion'

export function FooterMbbsIndiaGrid() {
  return (
    <section className="border-b border-gold-500/30 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="mb-1 text-lg font-bold text-gold-500">Study MBBS in India</h2>
        <p className="mb-6 text-sm text-gray-400">Browse medical colleges by state</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MBBS_INDIA_STATES.map((state) => (
            <FooterAccordion
              key={state.id}
              title={`MBBS in ${state.name}`}
              href={state.href}
            >
              <ul className="space-y-1">
                {state.colleges.map((college, index) => (
                  <li key={`${college.name}-${index}`}>
                    <Link
                      href={state.href}
                      className="block py-0.5 text-xs leading-snug text-gray-300 transition-colors hover:text-gold-400"
                    >
                      <span className="font-medium">{college.name}</span>
                      {college.city ? (
                        <span className="text-gray-500"> · {college.city}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </FooterAccordion>
          ))}
        </div>
      </div>
    </section>
  )
}
