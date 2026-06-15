'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from 'framer-motion'
import { ArrowRight, Globe2 } from 'lucide-react'
import { FitImage } from '@/components/ui/FitImage'
import {
  MBBS_ABROAD_SCROLL_COUNTRIES,
  resolveMbbsAbroadScrollImage,
  type MbbsAbroadScrollCountry,
} from '@/lib/mbbsAbroadScrollCountries'

function countryWatermarkTextClass(name: string, compact = false): string {
  if (compact) {
    if (name.length > 12) {
      return 'text-[clamp(1.25rem,4.5vw,2rem)] tracking-tight'
    }
    if (name.length > 9) {
      return 'text-[clamp(1.5rem,5.5vw,2.5rem)] tracking-tight'
    }
    return 'text-[clamp(1.75rem,7vw,3rem)] tracking-tight'
  }
  if (name.length > 12) {
    return 'text-[clamp(1.5rem,5.5vw,3.25rem)] tracking-tight'
  }
  if (name.length > 9) {
    return 'text-[clamp(2rem,7.5vw,4.5rem)] tracking-tight'
  }
  return 'text-[clamp(2.75rem,11vw,6.5rem)] tracking-tighter'
}

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

/** Image cards: fade only, no horizontal slide (prevents next slide peeking at edges). */
const imageCardVariants = {
  enter: { opacity: 0, scale: 0.98 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
}

/** Single gradient on sticky viewport, navy from top edge, seamless with hero */
const MBBS_ABROAD_PIN_BG =
  'bg-gradient-to-br from-navy-900 via-navy-800 to-[#0a2540]'

const MOBILE_FAB_PADDING =
  'pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]'

type CountryProgressProps = {
  countries: MbbsAbroadScrollCountry[]
  activeIndex: number
  onSelect?: (index: number) => void
}

function CountryProgress({ countries, activeIndex, onSelect }: CountryProgressProps) {
  const count = countries.length
  return (
    <div className="flex flex-col gap-3 border-t border-white/10 pt-5">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-300/70">
          Progress
        </span>
        <span className="font-mono text-sm font-medium text-gold-400">
          {String(activeIndex + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
        </span>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Country steps">
        {countries.map((c, i) => {
          const selected = i === activeIndex
          const className = `h-2 rounded-full transition-all duration-300 ${
            selected
              ? 'w-8 bg-gold-400 shadow-[0_0_10px_rgba(255,167,38,0.55)]'
              : 'w-2 bg-white/25'
          }`
          if (onSelect) {
            return (
              <button
                key={c.slug}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={`${c.name}, step ${i + 1}`}
                onClick={() => onSelect(i)}
                className={`${className} shrink-0`}
              />
            )
          }
          return (
            <span
              key={c.slug}
              role="tab"
              aria-selected={selected}
              aria-label={`${c.name}, step ${i + 1}`}
              className={className}
            />
          )
        })}
      </div>
    </div>
  )
}

type CountryVisualCardProps = {
  country: MbbsAbroadScrollCountry
  activeIndex: number
  count: number
  direction: number
  compact?: boolean
}

function CountryVisualCard({
  country,
  activeIndex,
  count,
  direction,
  compact = false,
}: CountryVisualCardProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const hasImage = Boolean(country.imageSrc) && !imgFailed
  const imageMaxHeight = compact
    ? 'min(42vw, 15rem)'
    : 'min(46vh, 24rem)'

  const cardClassName = `relative w-full max-w-full overflow-hidden rounded-2xl border border-white/20 shadow-2xl shadow-black/30 ${
    hasImage
      ? 'mbbs-abroad-country-visual bg-navy-950/50'
      : `flex items-center justify-center bg-gradient-to-br ${country.gradient} ${
          compact
            ? 'min-h-[min(42vw,15rem)] max-h-[min(42vw,15rem)]'
            : 'min-h-[min(46vh,24rem)] lg:min-h-[min(42vh,22rem)] lg:rounded-[2rem]'
        }`
  } ${!hasImage && !compact ? 'lg:rounded-[2rem]' : ''}`

  const cardBody = (
    <>
        {hasImage ? (
          <FitImage
            src={country.imageSrc!}
            alt={`MBBS in ${country.name}`}
            maxHeight={imageMaxHeight}
            frameClassName="w-full rounded-2xl bg-navy-950/40"
            sizes={compact ? '(max-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 50vw, 100vw'}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <>
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage: `radial-gradient(circle at 25% 75%, ${country.accent}55 0%, transparent 50%), radial-gradient(circle at 75% 25%, rgba(255,255,255,0.15) 0%, transparent 45%)`,
              }}
              aria-hidden
            />

            <div
              className={`absolute inset-0 flex flex-col items-center justify-center text-center ${
                compact ? 'p-4' : 'p-6 md:p-8'
              }`}
              aria-hidden
            >
              <p
                className={`mbbs-abroad-country-watermark max-w-full px-2 font-black uppercase text-white/20 ${countryWatermarkTextClass(country.name, compact)}`}
              >
                {country.name}
              </p>
              <p
                className={`mt-1.5 max-w-xs font-medium text-white/90 ${compact ? 'text-xs line-clamp-2' : 'text-sm md:text-base'}`}
              >
                {country.tagline}
              </p>
            </div>
          </>
        )}

        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-1.5 origin-left bg-gold-500"
          style={{
            transform: `scaleX(${(activeIndex + 1) / count})`,
            transition: 'transform 0.45s ease',
          }}
          aria-hidden
        />

        <div className="absolute right-3 top-3 rounded-full border border-white/25 bg-navy-900/50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm md:right-6 md:top-6">
          {String(activeIndex + 1).padStart(2, '0')}
        </div>
    </>
  )

  if (compact) {
    return <div className={cardClassName}>{cardBody}</div>
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={country.slug}
        custom={direction}
        variants={hasImage ? imageCardVariants : cardVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        className={cardClassName}
      >
        {cardBody}
      </motion.div>
    </AnimatePresence>
  )
}

function MbbsAbroadIntro({ count }: { count: number }) {
  return (
    <div className="mbbs-abroad-intro flex shrink-0 flex-col gap-2 md:gap-3">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-gold-400">
        MBBS Abroad · AR Group of Education
      </p>
      <p className="max-w-2xl text-sm leading-relaxed text-slate-200/90 md:text-base md:leading-relaxed">
        <span className="font-semibold text-white">AR Group of Education</span> helps Indian
        students secure MBBS seats at WHO-listed universities in{' '}
        <span className="font-semibold text-gold-300">{count}+ countries</span>, with end-to-end
        support for counselling, admissions, scholarships, documentation, and visa.
      </p>
    </div>
  )
}

/** Mobile + tablet: swipeable carousel (no scroll-pin). Desktop (lg+): scroll-driven steps. */
function MbbsAbroadScrollSectionMobile({
  countries,
}: {
  countries: MbbsAbroadScrollCountry[]
}) {
  const count = countries.length
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const prevIndexRef = useRef(0)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
  })

  const goToIndex = useCallback(
    (idx: number) => {
      const next = Math.max(0, Math.min(count - 1, idx))
      if (next !== prevIndexRef.current) {
        setDirection(next > prevIndexRef.current ? 1 : -1)
        prevIndexRef.current = next
      }
      setActiveIndex(next)
      emblaApi?.scrollTo(next)
    },
    [count, emblaApi],
  )

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap()
      if (idx !== prevIndexRef.current) {
        setDirection(idx > prevIndexRef.current ? 1 : -1)
        prevIndexRef.current = idx
      }
      setActiveIndex(idx)
    }
    emblaApi.on('select', onSelect)
    onSelect()
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi])

  const country = countries[activeIndex]

  return (
    <section
      className={`mbbs-abroad-mobile-panel relative scroll-mt-[4.5rem] lg:hidden ${MBBS_ABROAD_PIN_BG}`}
      aria-label="MBBS Abroad destinations"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-900/40 via-transparent to-navy-700/25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-100"
        aria-hidden
        style={{
          background: `radial-gradient(ellipse 70% 45% at 50% 55%, ${country.accent}22 0%, transparent 55%)`,
        }}
      />

      <div
        className={`relative z-[1] mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 md:px-8 md:py-8 ${MOBILE_FAB_PADDING}`}
      >
        <MbbsAbroadIntro count={count} />

        <div
          aria-live="polite"
          aria-atomic="true"
          className="mbbs-abroad-mobile-step relative z-20 mt-10 min-w-0"
        >
          <span className="mbbs-abroad-step-badge inline-flex items-center gap-2 rounded-full border border-gold-400/35 bg-gold-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-100 md:text-[11px]">
            <Globe2 className="h-3 w-3 text-gold-400" aria-hidden />
            Step {activeIndex + 1} · {country.name}
          </span>

          <h2 className="mt-4 font-serif text-2xl font-bold leading-tight text-white md:text-3xl">
            Study MBBS in{' '}
            <span className="bg-gradient-to-r from-gold-400 to-gold-500 bg-clip-text text-transparent">
              {country.name}
            </span>
          </h2>

          <p className="mt-2 text-sm font-medium text-gold-400/90 md:text-base">{country.tagline}</p>

          <p className="mt-3 text-sm leading-relaxed text-slate-200/85 md:text-base">
            {country.description}
          </p>

          <div className="mbbs-abroad-mobile-cta-wrap relative z-20 mt-5 md:mt-6">
            <Link
              href={`/mbbs-abroad/${country.slug}`}
              className="mbbs-abroad-cta group"
            >
              <span className="text-white">Explore {country.name}</span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-white transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </div>
        </div>

        <div
          className="mbbs-abroad-mobile-carousel relative z-0 mt-8 min-w-0 overflow-hidden touch-pan-y md:mt-10"
          ref={emblaRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="MBBS abroad country destinations"
        >
          <div className="flex flex-nowrap">
            {countries.map((c, i) => (
              <div
                key={c.slug}
                className="min-w-0 shrink-0 grow-0 basis-full"
                role="group"
                aria-roledescription="slide"
                aria-hidden={i !== activeIndex}
              >
                <CountryVisualCard
                  country={c}
                  activeIndex={i}
                  count={count}
                  direction={direction}
                  compact
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 md:mt-10">
          <CountryProgress
            countries={countries}
            activeIndex={activeIndex}
            onSelect={goToIndex}
          />
        </div>
      </div>
    </section>
  )
}

/** Desktop (lg+): scroll-driven pinned steps */
function MbbsAbroadScrollSectionDesktop({
  countries,
}: {
  countries: MbbsAbroadScrollCountry[]
}) {
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
    const clamped = Math.min(1, Math.max(0, v))
    const idx =
      count <= 1
        ? 0
        : clamped >= 1
          ? count - 1
          : Math.min(count - 1, Math.floor(clamped * count))
    if (idx !== prevIndexRef.current) {
      setDirection(idx > prevIndexRef.current ? 1 : -1)
      prevIndexRef.current = idx
    }
    setActiveIndex(idx)
  })

  /** Pin height + one viewport per country transition (N slides → N×pin scroll track) */
  const sectionHeight = useMemo(
    () =>
      count <= 1
        ? 'calc(100dvh - var(--mbbs-abroad-header-offset, 4.5rem))'
        : `calc(${count} * (100dvh - var(--mbbs-abroad-header-offset, 4.5rem)))`,
    [count],
  )
  const country = countries[activeIndex]

  return (
    <section
      ref={containerRef}
      className={`mbbs-abroad-scroll-section relative hidden scroll-mt-32 lg:block ${MBBS_ABROAD_PIN_BG}`}
      style={{ height: sectionHeight }}
      aria-label="MBBS Abroad destinations"
    >
      <motion.div
        className={`mbbs-abroad-scroll-pin sticky z-10 flex min-h-0 w-full flex-col overflow-hidden ${MBBS_ABROAD_PIN_BG}`}
      >
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-900/40 via-transparent to-navy-700/25"
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
          className="pointer-events-none absolute -right-16 top-1/4 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl"
          aria-hidden
        />

        <motion.div className="relative z-[1] mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col justify-between px-4 py-6 pb-7 md:px-8 md:py-8 md:pb-8 lg:py-10 lg:pb-10">
          <motion.div className="shrink-0">
            <MbbsAbroadIntro count={count} />
          </motion.div>

          <motion.div className="grid min-h-0 flex-1 items-center gap-6 py-4 md:gap-8 md:py-5 lg:grid-cols-2 lg:gap-10 lg:py-6 xl:gap-14">
            <motion.div className="order-1 flex min-h-0 flex-col justify-center" aria-live="polite" aria-atomic="true">
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

                  <p className="mt-3 text-sm font-medium text-gold-400/90 md:text-base">
                    {country.tagline}
                  </p>

                  <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-200/85 md:text-base md:leading-relaxed">
                    {country.description}
                  </p>

                  <Link
                    href={`/mbbs-abroad/${country.slug}`}
                    className="mbbs-abroad-cta group mt-8"
                  >
                    <span className="text-white">Explore {country.name}</span>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-white transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden
                    />
                  </Link>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <div className="order-2 flex min-h-0 w-full max-w-full items-center overflow-hidden">
              <CountryVisualCard
                country={country}
                activeIndex={activeIndex}
                count={count}
                direction={direction}
              />
            </div>
          </motion.div>

          <motion.div className="shrink-0 pb-6">
            <CountryProgress countries={countries} activeIndex={activeIndex} />
          </motion.div>
        </motion.div>

        <motion.div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-[2] h-1 shrink-0 bg-white/10"
          aria-hidden
        >
          <motion.div
            className="h-full bg-gradient-to-r from-gold-400 to-gold-500"
            style={{ width: progressWidth }}
          />
        </motion.div>
      </motion.div>
    </section>
  )
}

export function MbbsAbroadScrollSection() {
  const countries = useMemo(
    () =>
      MBBS_ABROAD_SCROLL_COUNTRIES.map((c) => ({
        ...c,
        imageSrc: resolveMbbsAbroadScrollImage(c),
      })),
    []
  )

  return (
    <div id="mbbs-abroad" className="scroll-mt-[4.5rem] lg:scroll-mt-32">
      <MbbsAbroadScrollSectionMobile countries={countries} />
      <MbbsAbroadScrollSectionDesktop countries={countries} />
    </div>
  )
}
