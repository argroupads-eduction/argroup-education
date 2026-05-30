'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Globe } from 'lucide-react';
import { HorizontalScrollItem, HorizontalScrollRow } from '@/components/ui/HorizontalScrollRow';
import { MBBS_ABROAD_COUNTRIES, mbbsAbroadCountryCollegeCount } from '@/lib/mbbsAbroadTree';

export function MbbsAbroadHubExplorer() {
  return (
    <section className="program-hub-section program-hub-section--soft">
      <div className="mx-auto max-w-7xl px-4">
        <div className="program-hub-section-head">
          <p className="program-hub-section-kicker">Explore by country</p>
          <h2 className="program-hub-section-title">WHO-listed destinations for Indian students</h2>
          <p className="program-hub-section-desc">
            Compare countries, universities, fees, and visa pathways — with the same content structure as our
            live WordPress guides.
          </p>
        </div>
        <HorizontalScrollRow ariaLabel="MBBS Abroad countries" autoScrollMobile gapClassName="gap-4">
          {MBBS_ABROAD_COUNTRIES.map((country) => {
            const count = mbbsAbroadCountryCollegeCount(country);
            return (
              <HorizontalScrollItem key={country.id} className="w-[17rem] sm:w-[18.5rem]">
                <Link href={country.href} className="program-hub-card group block h-full">
                  <div className="program-hub-card-media">
                    {country.featuredImage ? (
                      <Image
                        src={country.featuredImage}
                        alt=""
                        width={280}
                        height={180}
                        className="max-h-[6.5rem] w-auto max-w-full object-contain"
                        unoptimized
                      />
                    ) : (
                      <Globe className="h-10 w-10 text-slate-300" aria-hidden />
                    )}
                  </div>
                  <div className="program-hub-card-body">
                    <h3 className="program-hub-card-title">MBBS in {country.name}</h3>
                    <p className="program-hub-card-meta">
                      {count > 0 ? `${count} universities` : 'Country guide'}
                    </p>
                    <span className="program-hub-card-link inline-flex items-center gap-1">
                      Explore {country.name}
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </HorizontalScrollItem>
            );
          })}
        </HorizontalScrollRow>
      </div>
    </section>
  );
}
