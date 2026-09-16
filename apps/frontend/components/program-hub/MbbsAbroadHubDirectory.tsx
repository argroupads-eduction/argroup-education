import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { AbroadCollegeCard } from '@/components/mbbs-abroad/AbroadCollegeCard';
import { MBBS_ABROAD_HUB } from '@/lib/mbbsAbroadHubContent';
import {
  MBBS_ABROAD_COUNTRIES,
  abroadCollegeCount,
  flattenAbroadColleges,
  isMbbsAbroadThreeLevel,
  mbbsAbroadCountryCollegeCount,
} from '@/lib/mbbsAbroadTree';

export function MbbsAbroadHubDirectory() {
  const total = abroadCollegeCount();

  return (
    <section
      className="abroad-directory program-hub-section program-hub-section--soft"
      id="mbbs-abroad-colleges"
      aria-labelledby="abroad-directory-title"
    >
      <div className="mx-auto max-w-7xl px-4">
        <header className="program-hub-section-head">
          <p className="program-hub-section-kicker">University directory</p>
          <h2 id="abroad-directory-title" className="program-hub-section-title">
            {total}+ MBBS universities abroad, browse by country
          </h2>
          <p className="program-hub-section-desc">{MBBS_ABROAD_HUB.directoryIntro}</p>
        </header>

        <div className="abroad-directory__countries">
          {MBBS_ABROAD_COUNTRIES.map((country) => {
            const count = mbbsAbroadCountryCollegeCount(country);
            const flat = flattenAbroadColleges(country);
            if (!count && !flat.length) return null;

            return (
              <article
                key={country.id}
                className="abroad-directory__country"
                id={`mbbs-abroad-${country.id}`}
              >
                <div className="abroad-directory__country-head">
                  <div>
                    <p className="abroad-directory__country-kicker">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      Destination
                    </p>
                    <h3 className="abroad-directory__country-title">
                      <Link href={country.href}>MBBS in {country.name}</Link>
                    </h3>
                    <p className="abroad-directory__country-meta">
                      {count} {count === 1 ? 'university' : 'universities'} listed
                    </p>
                  </div>
                  <Link href={country.href} className="program-hub-btn-primary shrink-0">
                    Country hub
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>

                {isMbbsAbroadThreeLevel(country) && country.universities ? (
                  <div className="abroad-directory__universities">
                    {country.universities.map((university) => (
                      <div key={university.id} className="abroad-directory__uni-block">
                        <div className="abroad-directory__uni-head">
                          <h4>
                            <Link href={university.href}>{university.name}</Link>
                          </h4>
                          {university.colleges?.length ? (
                            <span>{university.colleges.length} colleges</span>
                          ) : null}
                        </div>
                        {university.colleges?.length ? (
                          <ul className="abroad-directory__grid">
                            {university.colleges.map((college, index) => (
                              <li key={`${university.id}-${college.name}`}>
                                <AbroadCollegeCard college={college} index={index} />
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="abroad-directory__grid">
                    {flat.map((college, index) => (
                      <li key={`${country.id}-${college.name}`}>
                        <AbroadCollegeCard college={college} index={index} />
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
