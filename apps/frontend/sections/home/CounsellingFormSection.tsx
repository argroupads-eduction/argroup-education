'use client'

import Link from 'next/link'
import {
  Building2,
  CheckCircle2,
  Globe2,
  GraduationCap,
  Phone,
  Stethoscope,
} from 'lucide-react'
import { CounsellingForm } from '@/components/forms/CounsellingForm'
import { Button } from '@/components/ui/Button'

const COUNSELLING_POINTS = [
  {
    icon: GraduationCap,
    text: 'MBBS in India — NEET counselling, state-wise college shortlisting & admission support',
  },
  {
    icon: Globe2,
    text: 'MBBS Abroad — WHO-listed, NMC-aligned universities across 15+ countries',
  },
  {
    icon: Stethoscope,
    text: 'MD/MS guidance — postgraduate pathways with transparent fee counselling',
  },
  {
    icon: Building2,
    text: 'End-to-end help — documentation, visa, scholarships & pre-departure briefing',
  },
] as const

const STATS = [
  { value: '4,000+', label: 'Students guided' },
  { value: '500+', label: 'Universities' },
  { value: '98%', label: 'Visa success' },
  { value: '19+', label: 'Years trust' },
] as const

export const CounsellingFormSection = () => {
  return (
    <section
      id="free-counselling"
      className="relative overflow-hidden bg-gradient-to-b from-navy-50/80 via-white to-gold-50/40 py-14 md:py-20"
    >
      <div
        className="pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full bg-navy-400/8 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-gold-400/15 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-[90rem] px-4 sm:px-5 md:px-6 lg:px-7 xl:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-navy-200/70 bg-gradient-to-br from-white via-navy-50/30 to-gold-50/50 p-6 shadow-2xl shadow-navy-900/12 ring-1 ring-gold-300/35 md:p-9 lg:p-12">
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold-400/10"
            aria-hidden
          />

          <div className="relative grid items-start gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-14">
            <div className="lg:pr-2">
              <span className="inline-flex items-center rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gold-800">
                Free counselling available
              </span>

              <h2 className="mt-4 font-serif text-2xl font-bold leading-tight text-navy-900 md:text-3xl lg:text-[2rem]">
                Get guided by the best{' '}
                <span className="text-gold-600">MBBS India &amp; Abroad</span> experts
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
                <span className="font-semibold text-navy-900">AR Group of Education</span> has
                helped thousands of Indian students choose the right medical college — with honest
                counselling, clear fees, and support from application to campus.
              </p>

              <ul className="mt-5 space-y-2.5">
                {COUNSELLING_POINTS.map(({ text }) => (
                  <li key={text} className="flex gap-2.5 text-sm text-slate-700">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-gold-600"
                      aria-hidden
                    />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-navy-100/80 bg-white px-2 py-2.5 text-center shadow-sm"
                  >
                    <p className="font-serif text-lg font-bold text-navy-900 md:text-xl">
                      {stat.value}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 md:text-xs">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="tel:+918001234567" className="counselling-call-link">
                  <Button
                    type="button"
                    variant="navy"
                    size="sm"
                    className="inline-flex items-center gap-2 rounded-full px-5"
                  >
                    <Phone className="h-4 w-4" aria-hidden />
                    Call now
                  </Button>
                </Link>
              </div>
            </div>

            <div
              id="counselling-form"
              className="rounded-2xl border border-navy-100/90 bg-white p-4 shadow-xl shadow-navy-900/12 ring-1 ring-gold-200/40 md:p-5 lg:sticky lg:top-24"
            >
              <div className="mb-3 border-l-4 border-gold-500 pl-3">
                <h3 className="font-serif text-lg font-bold text-navy-900">
                  Book free counselling
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Quick form — we reply within 24 hours
                </p>
              </div>
              <CounsellingForm embedded compact />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
