import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { MBBS_INDIA_STATES, collegeCount } from '@/lib/mbbsIndiaTree';

export function MbbsIndiaIndexHero() {
  const totalColleges = collegeCount();

  return (
    <section className="relative overflow-hidden bg-navy-900 py-16 md:py-24">
      <div
        className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-gold-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-gold-300">
            MBBS in India
          </span>
          <h1 className="mt-6 font-serif text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
            State-wise top medical colleges for{' '}
            <span className="bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
              MBBS in India
            </span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-blue-100/90 md:text-lg">
            Browse {MBBS_INDIA_STATES.length} states and {totalColleges}+ colleges — fees, NEET cut-offs, and expert
            admission counselling in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-gold-500 px-6 py-3 text-sm font-bold text-navy-900 transition hover:bg-gold-400"
            >
              Get free counselling
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/home#mbbs-india-colleges"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              Explore on homepage
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MBBS_INDIA_STATES.map((state) => (
            <Link
              key={state.id}
              href={state.href}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:border-gold-400/40 hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-bold text-white">{state.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-blue-100/70">
                    <MapPin className="h-3 w-3 text-gold-400" />
                    {state.colleges.length} colleges
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gold-400/60 transition group-hover:translate-x-0.5 group-hover:text-gold-300" />
              </div>
              <ul className="mt-4 space-y-1 border-t border-white/10 pt-3">
                {state.colleges.slice(0, 3).map((c) => (
                  <li key={c.name} className="truncate text-xs text-blue-100/60">
                    {c.name}
                  </li>
                ))}
                {state.colleges.length > 3 ? (
                  <li className="text-xs font-medium text-gold-400/90">+{state.colleges.length - 3} more</li>
                ) : null}
              </ul>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
