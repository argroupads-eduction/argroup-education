import { MBBS_ABROAD_COUNTRIES } from '@/lib/mbbsAbroadTree';
import { MBBS_INDIA_STATES } from '@/lib/mbbsIndiaTree';
import { resolveWpMediaUrl } from '@/lib/wpMediaUrl';

const LOCAL_COLLEGE_IMAGE = /^\/wp-content\/uploads\/colleges\//;

export function findCollegeInProgramTrees(slug: string): { image?: string | null; name: string } | null {
  for (const state of MBBS_INDIA_STATES) {
    const college = state.colleges.find((c) => c.slug === slug);
    if (college) return { image: college.image, name: college.name };
  }

  for (const country of MBBS_ABROAD_COUNTRIES) {
    const direct = country.colleges?.find((c) => c.slug === slug);
    if (direct) return { image: direct.image, name: direct.name };

    for (const uni of country.universities ?? []) {
      const nested = uni.colleges?.find((c) => c.slug === slug);
      if (nested) return { image: nested.image, name: nested.name };
    }
  }

  return null;
}

/** Prefer bundled college images from program tree; fall back to CMS featured image. */
export function resolveCollegeFeaturedImage(
  slug: string,
  cmsFeaturedImage: string | null | undefined
): string | null {
  const treeUrl = resolveWpMediaUrl(findCollegeInProgramTrees(slug)?.image);
  const cmsUrl = resolveWpMediaUrl(cmsFeaturedImage);

  if (treeUrl && LOCAL_COLLEGE_IMAGE.test(treeUrl)) return treeUrl;
  if (cmsUrl && LOCAL_COLLEGE_IMAGE.test(cmsUrl)) return cmsUrl;

  return treeUrl ?? cmsUrl;
}

export function isLocalCollegeBanner(url: string | null | undefined): boolean {
  const resolved = resolveWpMediaUrl(url);
  return Boolean(resolved && LOCAL_COLLEGE_IMAGE.test(resolved));
}
