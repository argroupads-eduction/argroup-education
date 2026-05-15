'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const stateColleges = [
  {
    id: 'up',
    name: 'Uttar Pradesh',
    colleges: [
      { name: 'King George Medical University', city: 'Lucknow' },
      { name: 'Ganesh Shankar Vidyarthi Memorial Medical College', city: 'Kanpur' },
      { name: 'Sanjay Gandhi Postgraduate Institute of Medical Sciences', city: 'Lucknow' },
    ],
  },
  {
    id: 'haryana',
    name: 'Haryana',
    colleges: [
      { name: 'Pandit Bhagwat Dayal Sharma Post Graduate Institute of Medical Sciences', city: 'Rohtak' },
      { name: 'Kalpana Chawla Government Medical College', city: 'Karnal' },
      { name: 'Pt. B.D. Sharma PGIMS', city: 'Rohtak' },
    ],
  },
  {
    id: 'rajasthan',
    name: 'Rajasthan',
    colleges: [
      { name: 'All India Institute of Medical Sciences', city: 'Jodhpur' },
      { name: 'Geetanjali Medical College', city: 'Udaipur' },
      { name: 'SMS Medical College', city: 'Jaipur' },
    ],
  },
  {
    id: 'maharashtra',
    name: 'Maharashtra',
    colleges: [
      { name: 'Grant Government Medical College', city: 'Mumbai' },
      { name: 'BJ Medical College', city: 'Pune' },
      { name: 'King Edward Memorial Hospital', city: 'Mumbai' },
    ],
  },
  {
    id: 'karnataka',
    name: 'Karnataka',
    colleges: [
      { name: 'Bangalore Medical College', city: 'Bengaluru' },
      { name: 'Mysore Medical College', city: 'Mysuru' },
      { name: 'Kasturba Medical College', city: 'Mangalore' },
    ],
  },
  {
    id: 'bihar',
    name: 'Bihar',
    colleges: [
      { name: 'Patna Medical College', city: 'Patna' },
      { name: 'AIIMS Patna', city: 'Patna' },
      { name: 'Jawaharlal Nehru Medical College', city: 'Bhagalpur' },
    ],
  },
  {
    id: 'delhi',
    name: 'Delhi',
    colleges: [
      { name: 'AIIMS Delhi', city: 'New Delhi' },
      { name: 'Lady Hardinge Medical College', city: 'New Delhi' },
      { name: 'Maulana Azad Medical College', city: 'New Delhi' },
    ],
  },
  {
    id: 'tamil-nadu',
    name: 'Tamil Nadu',
    colleges: [
      { name: 'Madras Medical College', city: 'Chennai' },
      { name: 'Christian Medical College', city: 'Vellore' },
      { name: 'Stanley Medical College', city: 'Chennai' },
    ],
  },
]

export const MBBSIndiaStateSection = () => {
  const [activeState, setActiveState] = useState(stateColleges[0].id)
  const [scrollPosition, setScrollPosition] = useState(0)
  const scrollContainers = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const stateIds = useMemo(() => stateColleges.map((state) => state.id), [])

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash && stateIds.includes(hash)) {
      setActiveState(hash)
      setScrollPosition(0)
    }
  }, [stateIds])

  const handleStateClick = (stateId: string) => {
    setActiveState(stateId)
    setScrollPosition(0)
  }

  const handleScroll = (stateId: string, direction: 'left' | 'right') => {
    const container = scrollContainers.current[stateId]
    if (!container) return

    const cardWidth = container.scrollWidth / 3
    const newPosition = scrollPosition + (direction === 'right' ? cardWidth : -cardWidth)

    container.scrollTo({
      left: direction === 'right' ? container.scrollLeft + cardWidth : container.scrollLeft - cardWidth,
      behavior: 'smooth',
    })

    setScrollPosition(newPosition)
  }

  const currentState = stateColleges.find((state) => state.id === activeState)

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

        {/* State Tabs */}
        <div className="mb-8 md:mb-10 overflow-x-auto pb-2">
          <div className="inline-flex gap-2 md:gap-3 px-2">
            {stateColleges.map((state) => (
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

        {/* Colleges Carousel */}
        {currentState && (
          <div className="relative">
            {/* Header */}
            <div className="mb-6">
              <h3 className="text-xl md:text-2xl font-semibold text-navy-900">{currentState.name}</h3>
              <p className="mt-1 text-xs md:text-sm text-slate-500">Top MBBS colleges in {currentState.name}.</p>
            </div>

            {/* Carousel Container */}
            <div className="relative group">
              {/* Scroll Container */}
              <div
                ref={(el) => {
                  if (el) scrollContainers.current[activeState] = el
                }}
                className="overflow-x-hidden"
              >
                <div className="flex gap-4 md:gap-6">
                  {currentState.colleges.map((college) => (
                    <div
                      key={college.name}
                      className="flex-shrink-0 w-full sm:w-1/2 md:w-1/3 rounded-2xl md:rounded-3xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <h4 className="text-base md:text-lg font-semibold text-navy-900 line-clamp-3">{college.name}</h4>
                      <p className="mt-2 md:mt-3 text-xs md:text-sm text-slate-500">{college.city}</p>
                      <div className="mt-4 md:mt-6 flex flex-wrap gap-2">
                        <span className="rounded-full bg-navy-900 px-2 md:px-3 py-1 text-xs font-semibold text-white">MBBS</span>
                        <span className="rounded-full bg-slate-100 px-2 md:px-3 py-1 text-xs font-semibold text-slate-700">
                          State
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <button
                onClick={() => handleScroll(activeState, 'left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 md:-translate-x-16 z-10 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-navy-900 text-white hover:bg-navy-800 transition opacity-0 group-hover:opacity-100"
                aria-label="Previous colleges"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                onClick={() => handleScroll(activeState, 'right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 md:translate-x-16 z-10 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-navy-900 text-white hover:bg-navy-800 transition opacity-0 group-hover:opacity-100"
                aria-label="Next colleges"
              >
                <ChevronRight size={20} />
              </button>

              {/* Mobile Scroll Hint */}
              <div className="md:hidden text-center mt-4 text-xs text-slate-500">Swipe to scroll →</div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
