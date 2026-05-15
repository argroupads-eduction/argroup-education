'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from 'framer-motion'
import { ArrowRight, Globe2 } from 'lucide-react'
import { MBBS_ABROAD_SCROLL_COUNTRIES } from '@/lib/mbbsAbroadScrollCountries'

const STEP_VH = 85

const contentVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    y: direction >= 0 ? 28 : -28,
  }),
  center: {
    opacity: 1,
    y: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    y: direction >= 0 ? -28 : 28,
  }),
}

const cardVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    scale: 0.96,
    x: direction >= 0 ? 48 : -48,
  }),
  center: {
    opacity: 1,
    scale: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    scale: 0.96,
    x: direction >= 0 ? -48 : 48,
  }),
}

export function MbbsAbroadScrollSection() {
  const countries = MBBS_ABROAD_SCROLL_COUNTRIES
  const count = countries.length
  const containerRef = useRef<HTMLElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const prevIndexRef = useRef(0)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const clamped = Math.min(0.999999, Math.max(0, v))
    const idx = Math.min(count - 1, Math.floor(clamped * count))
    if (idx !== prevIndexRef.current) {
      setDirection(idx > prevIndexRef.current ? 1 : -1)
      prevIndexRef.current = idx
    }
    setActiveIndex(idx)
  })

  const sectionHeight = useMemo(() => `${count * STEP_VH}vh`, [count])
  const country = countries[activeIndex]

  return (
    <section
      ref={containerRef}
      id="mbbs-abroad"
      className="relative"
      style={{ height: sectionHeight }}
      aria-label="MBBS Abroad destinations"
    >
      <motion.div className="sticky top-0 z-10 flex min-h-screen w-full items-center overflow-hidden bg-navy-900">
        <motion.div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              'linear-gradient(105deg, #051219 0%, #1a365d 42%, #1e4a7a 72%, #0c4a6e 100%)',
          }}
        />
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-900/80 via-transparent to-sky-900/25"
          aria-hidden
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={country.slug}
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            aria-hidden
            style={{
              background: `radial-gradient(ellipse 60% 50% at 72% 45%, ${country.accent}22 0%, transparent 55%)`,
            }}
          />
        </AnimatePresence>
        <motion.div
          className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-gold-500/12 blur-3xl"
          aria-hidden
        />
        <motion.div
          className="pointer-events-none absolute -right-16 top-1/4 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl"
          aria-hidden
        />

        <div className="relative z-[1] mx-auto w-full max-w-7xl px-4 py-16 md:px-8 md:py-20 lg:py-0">
          <div className="mb-8 flex flex-col gap-3 md:mb-10 lg:mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-gold-400">
              MBBS Abroad · AR Group of Education
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-blue-100/90 md:text-base md:leading-relaxed">
              <span className="font-semibold text-white">AR Group of Education</span> helps Indian
              students secure MBBS seats at WHO-listed universities in{' '}
              <span className="font-semibold text-gold-300">{count}+ countries</span> — with end-to-end
              support for counselling, admissions, scholarships, documentation, and visa.
            </p>
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20">
            {/* Left — step copy */}
            <motion.div
              className="order-1 flex flex-col"
              aria-live="polite"
              aria-atomic="true"
            >
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={country.slug}
                  custom={direction}
                  variants={contentVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                >
                  <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/35 bg-gold-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-100">
                    <Globe2 className="h-3.5 w-3.5 text-gold-400" aria-hidden />
                    Step {activeIndex + 1} · {country.name}
                  </span>

                  <h2 className="mt-5 font-serif text-3xl font-bold leading-tight text-white md:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
                    Study MBBS in{' '}
                    <span className="bg-gradient-to-r from-gold-400 to-gold-500 bg-clip-text text-transparent">
                      {country.name}
                    </span>
                  </h2>

                  <p className="mt-3 text-sm font-medium text-gold-200/90 md:text-base">
                    {country.tagline}
                  </p>

                  <p className="mt-4 max-w-lg text-sm leading-relaxed text-blue-100/85 md:text-base md:leading-relaxed">
                    {country.description}
                  </p>

                  <Link
                    href={`/mbbs-abroad/${country.slug}`}
                    className="mbbs-abroad-cta group mt-8 inline-flex w-fit items-center justify-center gap-2.5 rounded-xl border-2 border-gold-400/50 bg-gold-500 px-7 py-3.5 text-sm font-semibold shadow-lg shadow-gold-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-300 hover:bg-gold-600 hover:shadow-xl hover:shadow-gold-500/35 active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
                  >
                    <span className="text-white">Explore {country.name}</span>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-white transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden
                    />
                  </Link>
                </motion.div>
              </AnimatePresence>

              <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-8">
                <motion.div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold uppercase tracking-widest text-blue-200/70">
                    Progress
                  </span>
                  <span className="font-mono text-sm font-medium text-gold-400">
                    {String(activeIndex + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
                  </span>
                </motion.div>

                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Country steps">
                  {countries.map((c, i) => (
                    <span
                      key={c.slug}
                      role="tab"
                      aria-selected={i === activeIndex}
                      aria-label={`${c.name}, step ${i + 1}`}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === activeIndex
                          ? 'w-8 bg-gold-400 shadow-[0_0_10px_rgba(255,167,38,0.55)]'
                          : 'w-2 bg-white/25'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right — visual card */}
            <div className="order-2">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={country.slug}
                  custom={direction}
                  variants={cardVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                  className={`relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] border border-white/20 bg-gradient-to-br shadow-2xl shadow-black/30 ${country.gradient} md:aspect-[5/4] lg:rounded-[2rem]`}
                >
                  {country.imageSrc ? (
                    <Image
                      src={country.imageSrc}
                      alt={`MBBS in ${country.name}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  ) : null}

                  <div
                    className="absolute inset-0 opacity-50"
                    style={{
                      backgroundImage: `radial-gradient(circle at 25% 75%, ${country.accent}55 0%, transparent 50%), radial-gradient(circle at 75% 25%, rgba(255,255,255,0.15) 0%, transparent 45%)`,
                    }}
                    aria-hidden
                  />

                  <motion.div
                    className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
                    aria-hidden
                  >
                    <p className="text-[clamp(3.5rem,14vw,7rem)] font-black uppercase leading-none tracking-tighter text-white/20">
                      {country.name}
                    </p>
                    <p className="mt-2 max-w-xs text-sm font-medium text-white/90 md:text-base">
                      {country.tagline}
                    </p>
                  </motion.div>

                  <div
                    className="absolute bottom-0 left-0 right-0 h-1.5 origin-left bg-gold-500"
                    style={{
                      transform: `scaleX(${(activeIndex + 1) / count})`,
                      transition: 'transform 0.45s ease',
                    }}
                    aria-hidden
                  />

                  <motion.div
                    className="absolute right-4 top-4 rounded-full border border-white/25 bg-navy-900/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm md:right-6 md:top-6"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    {String(activeIndex + 1).padStart(2, '0')}
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-white/10"
          aria-hidden
        >
          <motion.div
            className="h-full bg-gradient-to-r from-sky-400/80 via-gold-400 to-gold-500"
            style={{ width: progressWidth }}
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
