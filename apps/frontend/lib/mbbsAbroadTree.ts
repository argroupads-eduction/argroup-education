import treeData from '@/data/mbbs-abroad-tree.json';

export type MbbsAbroadCollege = {
  name: string;
  slug: string | null;
  href: string;
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
  colleges?: MbbsAbroadCollege[];
  universities?: MbbsAbroadUniversity[];
};

export type MbbsAbroadTree = {
  generatedAt: string;
  source: string;
  countries: MbbsAbroadCountryColleges[];
};

export const MBBS_ABROAD_TREE = treeData as MbbsAbroadTree;
export const MBBS_ABROAD_COUNTRIES = MBBS_ABROAD_TREE.countries;

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
