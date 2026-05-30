import Link from 'next/link';
import { AbroadCollegeCard } from './AbroadCollegeCard';
import {
  flattenAbroadColleges,
  isMbbsAbroadThreeLevel,
  mbbsAbroadCountryCollegeCount,
  type MbbsAbroadCountryColleges,
} from '@/lib/mbbsAbroadTree';

type MbbsAbroadCountryGridProps = {
  country: MbbsAbroadCountryColleges;
};

export function MbbsAbroadCountryGrid({ country }: MbbsAbroadCountryGridProps) {
  const flatColleges = flattenAbroadColleges(country);
  const count = mbbsAbroadCountryCollegeCount(country);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-gold-600">Universities</p>
          <h2 className="mt-2 text-2xl font-bold text-navy-900 md:text-3xl">
            {count > 0 ? `${count} MBBS options in ${country.name}` : `MBBS in ${country.name}`}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
            Fees, eligibility, and admission details for each university.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex shrink-0 items-center rounded-full bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          Free counselling
        </Link>
      </div>

      {isMbbsAbroadThreeLevel(country) && country.universities ? (
        <div className="space-y-12">
          {country.universities.map((university) => (
            <div key={university.id}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-bold text-navy-900">{university.name}</h3>
                <Link href={university.href} className="text-sm font-semibold text-gold-700 hover:underline">
                  View details →
                </Link>
              </div>
              {university.colleges?.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {university.colleges.map((college, index) => (
                    <AbroadCollegeCard key={`${university.id}-${college.name}`} college={college} index={index} />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {flatColleges.map((college, index) => (
            <AbroadCollegeCard key={`${country.id}-${college.name}`} college={college} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
