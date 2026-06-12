'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Globe2, Sparkles } from 'lucide-react';
import {
  MBBS_ABROAD_COUNTRIES,
  mbbsAbroadCountryCollegeCount,
} from '@/lib/mbbsAbroadTree';
import { resolveWpMediaUrl } from '@/lib/wpMediaUrl';

const featuredIds = new Set(['russia', 'georgia', 'philippines', 'bangladesh']);

export function MbbsAbroadCountryOrbit() {
  const featured = MBBS_ABROAD_COUNTRIES.filter((c) => featuredIds.has(c.id));
  const rest = MBBS_ABROAD_COUNTRIES.filter((c) => !featuredIds.has(c.id));

  return (
    <section className="abroad-orbit" aria-labelledby="abroad-orbit-title">
      <div className="abroad-orbit__aurora" aria-hidden />
      <div className="abroad-orbit__grid-lines" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="abroad-orbit__head">
          <p className="abroad-orbit__kicker">
            <Sparkles className="h-4 w-4" aria-hidden />
            WHO-aligned destinations
          </p>
          <h2 id="abroad-orbit-title" className="abroad-orbit__title">
            Choose your <span>MBBS country</span>
          </h2>
          <p className="abroad-orbit__lead">
            Tap a destination, compare fees, NMC recognition, and universities without scrolling
            through a basic list.
          </p>
        </div>

        <div className="abroad-orbit__bento">
          {featured.map((country, i) => {
            const count = mbbsAbroadCountryCollegeCount(country);
            const imageSrc = resolveWpMediaUrl(country.featuredImage);
            return (
              <motion.div
                key={country.id}
                className={`abroad-orbit__tile abroad-orbit__tile--hero abroad-orbit__tile--${i % 2 === 0 ? 'a' : 'b'}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
              >
                <Link href={country.href} className="abroad-orbit__card abroad-orbit__card--hero group">
                  <span className="abroad-orbit__stamp">MBBS</span>
                  {imageSrc ? (
                    <div className="abroad-orbit__flag">
                      <Image
                        src={imageSrc}
                        alt=""
                        width={320}
                        height={200}
                        className="abroad-orbit__flag-img"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <Globe2 className="abroad-orbit__flag-fallback" aria-hidden />
                  )}
                  <div className="abroad-orbit__card-foot">
                    <h3 className="abroad-orbit__country">MBBS in {country.name}</h3>
                    <p className="abroad-orbit__meta">
                      {count > 0 ? `${count} universities` : 'Full country guide'}
                    </p>
                    <span className="abroad-orbit__cta">
                      Explore {country.name}
                      <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}

          {rest.map((country, i) => {
            const count = mbbsAbroadCountryCollegeCount(country);
            const imageSrc = resolveWpMediaUrl(country.featuredImage);
            return (
              <motion.div
                key={country.id}
                className="abroad-orbit__tile abroad-orbit__tile--compact"
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.08 + i * 0.03 }}
              >
                <Link href={country.href} className="abroad-orbit__card abroad-orbit__card--compact group">
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt=""
                      width={120}
                      height={72}
                      className="abroad-orbit__compact-img"
                      unoptimized
                    />
                  ) : null}
                  <div>
                    <h3 className="abroad-orbit__country-sm">{country.name}</h3>
                    <p className="abroad-orbit__meta-sm">
                      {count > 0 ? `${count} unis` : 'Guide'}
                    </p>
                  </div>
                  <ArrowUpRight className="abroad-orbit__arrow-sm" aria-hidden />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
