'use client'

import React, { useEffect, useMemo, useState } from 'react'

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

export const MBBSIndiaStateSection: React.FC = () => {
  const [activeState, setActiveState] = useState(stateColleges[0].id)

  const stateIds = useMemo(() => stateColleges.map((state) => state.id), [])

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash && stateIds.includes(hash)) {
      setActiveState(hash)
    }
  }, [stateIds])

  const handleStateClick = (stateId: string) => {
    setActiveState(stateId)
    const section = document.getElementById(stateId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.history.replaceState(null, '', `#${stateId}`)
    }
  }

  return (
    <section className="bg-slate-50 py-16" id="mbbs-india-colleges">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center mb-12">
          <p className="text-sm uppercase tracking-[0.32em] text-primary font-semibold">MBBS in India</p>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold text-navy-900">State-wise Top Medical Colleges</h2>
          <p className="mt-4 text-base text-slate-600">
            Select a state below to view top MBBS colleges in that region. The list updates automatically so you can keep content fresh.
          </p>
        </div>

        <div className="mb-12 overflow-x-auto pb-2">
          <div className="inline-flex gap-3 px-2">
            {stateColleges.map((state) => (
              <button
                key={state.id}
                type="button"
                onClick={() => handleStateClick(state.id)}
                className={`shrink-0 rounded-full border px-5 py-3 text-sm font-medium transition ${
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

        <div className="space-y-16">
          {stateColleges.map((state) => (
            <div key={state.id} id={state.id} className="scroll-mt-24">
              <div className="mb-8 border-b border-slate-200 pb-4">
                <h3 className="text-2xl font-semibold text-navy-900">{state.name}</h3>
                <p className="mt-2 text-sm text-slate-500">Top MBBS colleges in {state.name}.</p>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {state.colleges.map((college) => (
                  <div key={college.name} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                    <h4 className="text-lg font-semibold text-navy-900">{college.name}</h4>
                    <p className="mt-3 text-sm text-slate-500">{college.city}</p>
                    <div className="mt-6 flex gap-3">
                      <span className="rounded-full bg-navy-900 px-3 py-1 text-xs font-semibold text-white">MBBS</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">State: {state.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
