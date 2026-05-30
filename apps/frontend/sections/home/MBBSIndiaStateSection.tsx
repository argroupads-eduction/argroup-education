'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, GraduationCap, MapPin } from 'lucide-react'
import { MBBS_INDIA_STATES } from '@/lib/mbbsIndiaTree'
import { CollegeCard } from '@/components/mbbs-india/CollegeCard'

export const MBBSIndiaStateSection = () => {
  const [activeState, setActiveState] = useState(MBBS_INDIA_STATES[0].id)

  const stateIds = useMemo(() => MBBS_INDIA_STATES.map((state) => state.id), [])

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash && stateIds.includes(hash)) {
      setActiveState(hash)
      const el = document.getElementById('mbbs-india-colleges')
      if (el) {
        window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      }
    }
  }, [stateIds])

  const handleStateClick = (stateId: string) => {
    setActiveState(stateId)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${stateId}`)
    }
  }

  const currentState = MBBS_INDIA_STATES.find((state) => state.id === activeState)

  return (
    <section className="relative overflow-hidden bg-slate-50 py-16 md:py-24" id="mbbs-india-colleges">
      <div
        className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-gold-400/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4">
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-gold-700">
            <GraduationCap className="h-3.5 w-3.5" />
            MBBS in India
          </span>
          <h2 className="mt-5 text-3xl font-bold text-navy-900 md:text-5xl">
            State-wise top medical colleges
          </h2>
          <p className="mt-4 text-sm text-slate-600 md:text-base">
            Every college links to detailed fees, eligibility, and admission information.
          </p>
        </div>

        <div className="mb-10 overflow-x-auto pb-2">
          <div className="inline-flex min-w-full justify-center gap-2 md:gap-3">
            {MBBS_INDIA_STATES.map((state) => (
              <button
                key={state.id}
                type="button"
                onClick={() => handleStateClick(state.id)}
                className={[
                  'shrink-0 rounded-full border px-4 py-2.5 text-xs font-semibold transition md:px-5 md:py-3 md:text-sm',
                  activeState === state.id
                    ? 'border-transparent bg-navy-900 text-white shadow-lg shadow-navy-900/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-gold-300 hover:text-navy-900',
                ].join(' ')}
              >
                {state.navLabel || state.name}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentState && (
            <motion.div
              key={currentState.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold-600">
                    <MapPin className="h-3.5 w-3.5" />
                    {currentState.name}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-navy-900 md:text-3xl">
                    {currentState.colleges.length} MBBS colleges
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Tap any college for the full page — same content as argroupofeducation.com
                  </p>
                </div>
                <Link
                  href={currentState.href}
                  className="inline-flex items-center gap-2 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-gold-400"
                >
                  View {currentState.name} hub
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {currentState.colleges.map((college, index) => (
                  <CollegeCard key={`${currentState.id}-${college.name}-${index}`} college={college} index={index} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 text-center">
          <Link
            href="/mbbs-india"
            className="inline-flex items-center gap-2 text-sm font-semibold text-navy-900 hover:text-gold-700"
          >
            Browse all states on MBBS India
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
