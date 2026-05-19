'use client'

import Link from 'next/link'
import {
  MBBS_ABROAD_COUNTRIES,
  isMbbsAbroadThreeLevel,
  mbbsAbroadCollegeHref,
  mbbsAbroadCountryHref,
} from '@/lib/mbbsAbroadCollegesByCountry'
import { FooterAccordion } from './FooterAccordion'

function CollegeLinks({
  countryId,
  names,
}: {
  countryId: string
  names: { name: string }[]
}) {
  const href = mbbsAbroadCollegeHref(countryId)
  return (
    <ul className="space-y-1">
      {names.map((college, index) => (
        <li key={`${college.name}-${index}`}>
          <Link
            href={href}
            className="block py-0.5 text-xs leading-snug text-gray-300 transition-colors hover:text-gold-400"
          >
            {college.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function FooterMbbsAbroadGrid() {
  return (
    <section className="border-b border-gold-500/30 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="mb-1 text-lg font-bold text-gold-500">Study MBBS Abroad</h2>
        <p className="mb-6 text-sm text-gray-400">Browse universities by country</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MBBS_ABROAD_COUNTRIES.map((country) => {
            const title = `MBBS in ${country.name}`
            const href = mbbsAbroadCountryHref(country.id)

            if (isMbbsAbroadThreeLevel(country) && country.universities?.length) {
              return (
                <FooterAccordion key={country.id} title={title} href={href}>
                  <div className="space-y-2">
                    {country.universities.map((university) => {
                      if (university.colleges?.length) {
                        return (
                          <FooterAccordion
                            key={university.id}
                            title={university.name}
                            href={university.href}
                            nested
                          >
                            <CollegeLinks
                              countryId={country.id}
                              names={university.colleges}
                            />
                          </FooterAccordion>
                        )
                      }
                      return (
                        <Link
                          key={university.id}
                          href={university.href}
                          className="block py-1 text-xs text-gray-300 hover:text-gold-400"
                        >
                          {university.name}
                        </Link>
                      )
                    })}
                  </div>
                </FooterAccordion>
              )
            }

            const colleges = country.colleges ?? []
            return (
              <FooterAccordion key={country.id} title={title} href={href}>
                {colleges.length > 0 ? (
                  <CollegeLinks countryId={country.id} names={colleges} />
                ) : null}
              </FooterAccordion>
            )
          })}
        </div>
      </div>
    </section>
  )
}
