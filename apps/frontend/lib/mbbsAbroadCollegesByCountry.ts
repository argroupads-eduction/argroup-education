/** @deprecated Import from `@/lib/mbbsAbroadTree` — re-exported for backward compatibility. */
export {
  MBBS_ABROAD_COUNTRIES,
  isMbbsAbroadThreeLevel,
  getMbbsAbroadCountryById,
  mbbsAbroadCountryHref,
  mbbsAbroadUniversityHref,
  mbbsAbroadCountryCollegeCount,
  type MbbsAbroadCollege,
  type MbbsAbroadUniversity,
  type MbbsAbroadCountryColleges,
} from '@/lib/mbbsAbroadTree';

/** @deprecated Use college.href from tree instead. */
export function mbbsAbroadCollegeHref(countryId: string): string {
  return `/mbbs-abroad/${countryId}`;
}
