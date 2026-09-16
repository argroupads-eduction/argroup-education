'use client';

import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Globe2, GraduationCap, Sparkles } from 'lucide-react';
import {
  MBBS_ABROAD_COUNTRIES,
  mbbsAbroadCountryCollegeCount,
} from '@/lib/mbbsAbroadTree';
import { resolveMbbsAbroadFeaturedImage } from '@/lib/mbbsAbroadCountryImages';
import { resolveWpMediaUrl } from '@/lib/wpMediaUrl';

const FEATURED_IDS = ['russia', 'georgia', 'bangladesh', 'philippines'] as const;

const COUNTRY_ACCENTS: Record<string, string> = {
  russia: '#60a5fa',
  georgia: '#f87171',
  philippines: '#fbbf24',
  bangladesh: '#4ade80',
  nepal: '#fb7185',
  uzbekistan: '#38bdf8',
  kazakhstan: '#22d3ee',
  serbia: '#a78bfa',
  iran: '#34d399',
  bosnia: '#818cf8',
  egypt: '#fcd34d',
  vietnam: '#f472b6',
  kyrgyzstan: '#2dd4bf',
  china: '#ef4444',
  romania: '#c084fc',
  asia: '#94a3b8',
};

const COUNTRY_TAGLINES: Record<string, string> = {
  russia: 'WHO-listed · English-medium options',
  georgia: 'European campus · NMC recognised',
  bangladesh: 'Affordable fees · cultural proximity',
  philippines: 'US-style curriculum · English medium',
  nepal: 'Close to India · familiar culture',
  uzbekistan: 'Modern campuses · growing hub',
  kazakhstan: 'Safe cities · transparent admissions',
  kyrgyzstan: 'Budget-friendly · quality labs',
  china: 'Advanced infrastructure · global exposure',
};

type Country = (typeof MBBS_ABROAD_COUNTRIES)[number];

function countryImage(country: Country) {
  return resolveWpMediaUrl(
    resolveMbbsAbroadFeaturedImage(country.wpSlug, country.featuredImage)
  );
}

function countryAccent(id: string) {
  return COUNTRY_ACCENTS[id] ?? '#fbbf24';
}

function countryTagline(country: Country) {
  return COUNTRY_TAGLINES[country.id] ?? 'Complete MBBS country guide';
}

function FeaturedCard({ country, index }: { country: Country; index: number }) {
  const count = mbbsAbroadCountryCollegeCount(country);
  const imageSrc = countryImage(country);
  const accent = countryAccent(country.id);

  return (
    <li className="abroad-destinations__featured-item">
      <Link
        href={country.href}
        className="abroad-destinations__featured-card"
        style={{ '--country-accent': accent } as CSSProperties}
      >
        <div className="abroad-destinations__featured-visual">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={`MBBS in ${country.name}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="abroad-destinations__featured-img"
              unoptimized
            />
          ) : (
            <div className="abroad-destinations__media-fallback abroad-destinations__media-fallback--hero">
              <Globe2 className="h-10 w-10" />
            </div>
          )}
          <div className="abroad-destinations__featured-visual-fade" aria-hidden />
          <div className="abroad-destinations__featured-accent-line" aria-hidden />
          <span className="abroad-destinations__featured-index" aria-hidden>
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <div className="abroad-destinations__featured-body">
          <div className="abroad-destinations__featured-top">
            <span className="abroad-destinations__code">{country.name.slice(0, 2).toUpperCase()}</span>
            <span className="abroad-destinations__count">
              {count > 0 ? `${count} universities` : 'Country guide'}
            </span>
          </div>
          <h3 className="abroad-destinations__featured-title">MBBS in {country.name}</h3>
          <p className="abroad-destinations__featured-tagline">{countryTagline(country)}</p>
          <span className="abroad-destinations__featured-cta">
            Explore {country.name}
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </Link>
    </li>
  );
}

function RailCard({ country }: { country: Country }) {
  const count = mbbsAbroadCountryCollegeCount(country);
  const imageSrc = countryImage(country);
  const accent = countryAccent(country.id);

  return (
    <li className="abroad-destinations__rail-item">
      <Link
        href={country.href}
        className="abroad-destinations__rail-card"
        style={{ '--country-accent': accent } as CSSProperties}
      >
        <div className="abroad-destinations__rail-thumb">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt=""
              fill
              sizes="88px"
              className="abroad-destinations__rail-img"
              unoptimized
            />
          ) : (
            <div className="abroad-destinations__media-fallback" aria-hidden>
              <Globe2 className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="abroad-destinations__rail-body">
          <h3 className="abroad-destinations__rail-title">{country.name}</h3>
          <p className="abroad-destinations__rail-meta">
            {count > 0 ? `${count} universities` : 'Open guide'}
          </p>
        </div>
        <ArrowUpRight className="abroad-destinations__rail-arrow" aria-hidden />
      </Link>
    </li>
  );
}

export function MbbsAbroadCountryOrbit() {
  const featured = MBBS_ABROAD_COUNTRIES.filter((c) =>
    FEATURED_IDS.includes(c.id as (typeof FEATURED_IDS)[number])
  );
  const rest = MBBS_ABROAD_COUNTRIES.filter(
    (c) => !FEATURED_IDS.includes(c.id as (typeof FEATURED_IDS)[number])
  );

  const totalUniversities = MBBS_ABROAD_COUNTRIES.reduce(
    (sum, country) => sum + mbbsAbroadCountryCollegeCount(country),
    0
  );

  return (
    <section
      id="mbbs-abroad-countries"
      className="abroad-destinations"
      aria-labelledby="abroad-destinations-title"
    >
      <div className="abroad-destinations__aurora" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4">
        <header className="abroad-destinations__head">
          <div className="abroad-destinations__head-copy">
            <p className="abroad-destinations__kicker">
              <Sparkles className="h-4 w-4" aria-hidden />
              Pick your destination
            </p>
            <h2 id="abroad-destinations-title" className="abroad-destinations__title">
              Where will you study <span>MBBS abroad?</span>
            </h2>
            <p className="abroad-destinations__lead">
              Compare NMC recognition, tuition bands, and universities — then open a country hub
              with fees, eligibility, and counselling support from AR Group.
            </p>
          </div>

          <div className="abroad-destinations__stats" aria-label="MBBS abroad coverage">
            <div className="abroad-destinations__stat">
              <span className="abroad-destinations__stat-value">{MBBS_ABROAD_COUNTRIES.length}</span>
              <span className="abroad-destinations__stat-label">Countries</span>
            </div>
            <div className="abroad-destinations__stat">
              <span className="abroad-destinations__stat-value">{totalUniversities}+</span>
              <span className="abroad-destinations__stat-label">Universities</span>
            </div>
            <div className="abroad-destinations__stat abroad-destinations__stat--gold">
              <GraduationCap className="h-4 w-4" aria-hidden />
              <span className="abroad-destinations__stat-label">Expert counselling</span>
            </div>
          </div>
        </header>

        {featured.length > 0 ? (
          <ul className="abroad-destinations__featured-grid">
            {featured.map((country, index) => (
              <FeaturedCard key={country.id} country={country} index={index} />
            ))}
          </ul>
        ) : null}

        {rest.length > 0 ? (
          <div className="abroad-destinations__rail-wrap">
            <div className="abroad-destinations__rail-head">
              <h3 className="abroad-destinations__rail-label">More destinations</h3>
              <p className="abroad-destinations__rail-hint">Swipe to browse all countries</p>
            </div>
            <ul className="abroad-destinations__rail">
              {rest.map((country) => (
                <RailCard key={country.id} country={country} />
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
