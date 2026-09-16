import { MBBS_ABROAD_COUNTRIES } from '@/lib/mbbsAbroadTree';
import { MBBS_INDIA_STATES } from '@/lib/mbbsIndiaTree';

export type CollegeProgramEntry = {
  name: string;
  slug: string;
  href: string;
  image?: string | null;
  city?: string;
  program: 'india' | 'abroad';
  regionName: string;
  regionHref: string;
};

export function findCollegeProgramEntry(slug: string): CollegeProgramEntry | null {
  for (const state of MBBS_INDIA_STATES) {
    const college = state.colleges.find((c) => c.slug === slug);
    if (college?.slug) {
      return {
        name: college.name,
        slug: college.slug,
        href: college.href,
        image: college.image,
        city: college.city,
        program: 'india',
        regionName: state.name,
        regionHref: state.href,
      };
    }
  }

  for (const country of MBBS_ABROAD_COUNTRIES) {
    const direct = country.colleges?.find((c) => c.slug === slug);
    if (direct?.slug) {
      return {
        name: direct.name,
        slug: direct.slug,
        href: direct.href,
        image: direct.image,
        program: 'abroad',
        regionName: country.name,
        regionHref: country.href,
      };
    }

    for (const uni of country.universities ?? []) {
      const nested = uni.colleges?.find((c) => c.slug === slug);
      if (nested?.slug) {
        return {
          name: nested.name,
          slug: nested.slug,
          href: nested.href,
          image: nested.image,
          program: 'abroad',
          regionName: country.name,
          regionHref: country.href,
        };
      }
    }
  }

  return null;
}
