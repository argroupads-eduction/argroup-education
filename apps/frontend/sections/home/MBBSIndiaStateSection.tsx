'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MBBS_INDIA_STATES, type MbbsIndiaCollege } from '@/lib/mbbsIndiaCollegesByState'

function StateCollegesCarousel({ colleges }: { colleges: MbbsIndiaCollege[] }) {
  const autoplay = useMemo(
    () =>
      Autoplay({
        delay: 3800,
        playOnInit: true,
        stopOnMouseEnter: true,
        stopOnInteraction: true,
        stopOnFocusIn: false,
      }),
    []
  )

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: colleges.length > 1,
      align: 'start',
      dragFree: false,
      skipSnaps: false,
    },
    [autoplay]
  )

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.reInit()
    emblaApi.scrollTo(0, false)
  }, [emblaApi, colleges])

  return (
    <div className="relative group">
      <div
        className="overflow-hidden rounded-xl"
        ref={emblaRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Medical colleges in this state"
      >
        <div className="flex -ml-3 md:-ml-4">
          {colleges.map((college, index) => (
            <div
              key={`${college.name}-${index}`}
              className="min-w-0 shrink-0 grow-0 pl-3 md:pl-4 basis-[88%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              role="group"
              aria-roledescription="slide"
            >
              <div className="h-full rounded-2xl md:rounded-3xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <h4 className="text-base md:text-lg font-semibold text-navy-900 line-clamp-3">{college.name}</h4>
                {college.city ? (
                  <p className="mt-2 md:mt-3 text-xs md:text-sm text-slate-500">{college.city}</p>
                ) : null}
                <div className="mt-4 md:mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full bg-navy-900 px-2 md:px-3 py-1 text-xs font-semibold text-white">
                    MBBS
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 md:px-3 py-1 text-xs font-semibold text-slate-700">
                    State
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={scrollPrev}
        className="absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-x-10 -translate-y-1/2 items-center justify-center rounded-full bg-navy-900 text-white transition hover:bg-navy-800 md:flex md:-translate-x-14 lg:-translate-x-16 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        aria-label="Previous colleges"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        type="button"
        onClick={scrollNext}
        className="absolute right-0 top-1/2 z-10 hidden h-10 w-10 translate-x-10 -translate-y-1/2 items-center justify-center rounded-full bg-navy-900 text-white transition hover:bg-navy-800 md:flex md:translate-x-14 lg:translate-x-16 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        aria-label="Next colleges"
      >
        <ChevronRight size={20} />
      </button>

      <p className="mt-3 text-center text-xs text-slate-500 md:hidden">
        Swipe to browse · auto-play pauses while you scroll
      </p>
    </div>
  )
}

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
    <section className="section bg-slate-50 py-12 md:py-16" id="mbbs-india-colleges">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center mb-10 md:mb-12">
          <p className="text-xs md:text-sm uppercase tracking-[0.32em] text-primary font-semibold">MBBS in India</p>
          <h2 className="mt-3 md:mt-4 text-3xl md:text-5xl font-bold text-navy-900">State-wise Top Medical Colleges</h2>
          <p className="mt-3 md:mt-4 text-sm md:text-base text-slate-600">
            Select a state below to view top MBBS colleges in that region.
          </p>
        </div>

        <div className="mb-8 md:mb-10 overflow-x-auto pb-2">
          <div className="inline-flex gap-2 md:gap-3 px-2">
            {MBBS_INDIA_STATES.map((state) => (
              <button
                key={state.id}
                type="button"
                onClick={() => handleStateClick(state.id)}
                className={`shrink-0 rounded-full border px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm font-medium transition ${
                  activeState === state.id
                    ? 'bg-navy-900 text-white border-transparent'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-navy-900'
                }`}
              >
                {state.name}
              </button>
            ))}
          </div>
        </div>

        {currentState && (
          <div className="relative">
            <div className="mb-6">
              <h3 className="text-xl md:text-2xl font-semibold text-navy-900">{currentState.name}</h3>
              <p className="mt-1 text-xs md:text-sm text-slate-500">
                {currentState.colleges.length} MBBS colleges in {currentState.name}.
              </p>
            </div>

            <StateCollegesCarousel key={currentState.id} colleges={currentState.colleges} />
          </div>
        )}
      </div>
    </section>
  )
}
