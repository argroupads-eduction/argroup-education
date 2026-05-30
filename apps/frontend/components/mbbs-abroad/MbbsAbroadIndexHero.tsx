import Link from 'next/link';
import { ArrowRight, Globe } from 'lucide-react';
import {
  MBBS_ABROAD_COUNTRIES,
  abroadCollegeCount,
  mbbsAbroadCountryCollegeCount,
} from '@/lib/mbbsAbroadTree';

export function MbbsAbroadIndexHero() {
  const totalColleges = abroadCollegeCount();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-navy-900 to-blue-950 py-16 md:py-24">
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-gold-500/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-gold-300">
            <Globe className="h-3.5 w-3.5" />
            MBBS Abroad
          </span>
          <h1 className="mt-6 font-serif text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
            Study MBBS abroad at{' '}
            <span className="bg-gradient-to-r from-gold-300 to-orange-400 bg-clip-text text-transparent">
              world-class universities
            </span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-blue-100/90 md:text-lg">
            {MBBS_ABROAD_COUNTRIES.length} countries · {totalColleges}+ universities — WHO-listed options with end-to-end
            admission & visa support.
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
              href="/home#mbbs-abroad"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              Explore on homepage
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MBBS_ABROAD_COUNTRIES.map((country) => {
            const count = mbbsAbroadCountryCollegeCount(country);
            return (
              <Link
                key={country.id}
                href={country.href}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:border-gold-400/40 hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-bold text-white">{country.name}</p>
                    <p className="mt-1 text-xs text-blue-100/70">
                      {count > 0 ? `${count} universities` : 'Country guide'}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gold-400/60 transition group-hover:translate-x-0.5 group-hover:text-gold-300" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
