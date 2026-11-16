import treeData from '@/data/mbbs-abroad-tree.json';
import { resolveCollegeImageUrl } from '@/lib/collegeImageIndex';

export type MbbsAbroadCollege = {
  name: string;
  slug: string | null;
  href: string;
  image?: string | null;
};

export type MbbsAbroadUniversity = {
  id: string;
  name: string;
  href: string;
  slug: string | null;
  colleges?: MbbsAbroadCollege[];
};

export type MbbsAbroadCountryColleges = {
  id: string;
  name: string;
  navLabel: string;
  href: string;
  wpSlug: string | null;
  featuredImage?: string | null;
  colleges?: MbbsAbroadCollege[];
  universities?: MbbsAbroadUniversity[];
};

export type MbbsAbroadTree = {
  generatedAt: string;
  source: string;
  countries: MbbsAbroadCountryColleges[];
};

export const MBBS_ABROAD_TREE = treeData as MbbsAbroadTree;

/** Nav / mega-menu country order (remaining countries keep bundle order). */
const MBBS_ABROAD_COUNTRY_ORDER = [
  'russia',
  'nepal',
  'uzbekistan',
  'kazakhstan',
  'georgia',
] as const;

function sortMbbsAbroadCountries(
  countries: MbbsAbroadCountryColleges[]
): MbbsAbroadCountryColleges[] {
  const originalIndex = new Map(countries.map((c, i) => [c.id, i]));
  return [...countries].sort((a, b) => {
    const aRank = MBBS_ABROAD_COUNTRY_ORDER.indexOf(
      a.id as (typeof MBBS_ABROAD_COUNTRY_ORDER)[number]
    );
    const bRank = MBBS_ABROAD_COUNTRY_ORDER.indexOf(
      b.id as (typeof MBBS_ABROAD_COUNTRY_ORDER)[number]
    );
    const aOrder = aRank === -1 ? MBBS_ABROAD_COUNTRY_ORDER.length + (originalIndex.get(a.id) ?? 0) : aRank;
    const bOrder = bRank === -1 ? MBBS_ABROAD_COUNTRY_ORDER.length + (originalIndex.get(b.id) ?? 0) : bRank;
    return aOrder - bOrder;
  });
}

function withResolvedCollegeImage(college: MbbsAbroadCollege): MbbsAbroadCollege {
  return {
    ...college,
    image: resolveCollegeImageUrl(college.slug, college.image, college.name),
  };
}

export const MBBS_ABROAD_COUNTRIES = sortMbbsAbroadCountries(MBBS_ABROAD_TREE.countries).map((country) => ({
  ...country,
  colleges: country.colleges?.map(withResolvedCollegeImage),
  universities: country.universities?.map((uni) => ({
    ...uni,
    colleges: uni.colleges?.map(withResolvedCollegeImage),
  })),
}));

export function isMbbsAbroadThreeLevel(country: MbbsAbroadCountryColleges): boolean {
  return Boolean(country.universities?.length);
}

export function getMbbsAbroadCountryById(id: string): MbbsAbroadCountryColleges | undefined {
  return MBBS_ABROAD_COUNTRIES.find((c) => c.id === id);
}

export function mbbsAbroadCountryHref(countryId: string): string {
  return `/mbbs-abroad/${countryId}`;
}

export function mbbsAbroadUniversityHref(countryId: string, universityId: string): string {
  return `/mbbs-abroad/${countryId}/${universityId}`;
}

export function mbbsAbroadCountryCollegeCount(country: MbbsAbroadCountryColleges): number {
  if (country.colleges?.length) return country.colleges.length;
  if (!country.universities?.length) return 0;
  return country.universities.reduce((sum, u) => sum + (u.colleges?.length ?? 0), 0);
}

export function abroadCollegeCount(): number {
  return MBBS_ABROAD_COUNTRIES.reduce((n, c) => n + mbbsAbroadCountryCollegeCount(c), 0);
}

/** Flatten all colleges for a country (2-level or nested universities). */
export function flattenAbroadColleges(country: MbbsAbroadCountryColleges): MbbsAbroadCollege[] {
  if (country.colleges?.length) return country.colleges;
  if (!country.universities?.length) return [];
  return country.universities.flatMap((u) => u.colleges ?? []);
}
