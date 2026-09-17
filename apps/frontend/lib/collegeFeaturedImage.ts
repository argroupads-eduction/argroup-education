import { resolveCollegeImageUrl } from '@/lib/collegeImageIndex';
import { findCollegeProgramEntry } from '@/lib/collegeProgramLookup';
import { resolvePageFeaturedImage } from '@/lib/pageFeaturedImages';
import { resolveWpMediaUrl } from '@/lib/wpMediaUrl';

const LOCAL_COLLEGE_IMAGE = /^\/wp-content\/uploads\/colleges\//;

export function findCollegeInProgramTrees(slug: string): { image?: string | null; name: string } | null {
  const entry = findCollegeProgramEntry(slug);
  if (!entry) return null;
  return { image: entry.image, name: entry.name };
}

/** Prefer bundled college images from program tree; fall back to CMS featured image. */
export function resolveCollegeFeaturedImage(
  slug: string,
  cmsFeaturedImage: string | null | undefined
): string | null {
  const pageCurated = resolvePageFeaturedImage(slug, cmsFeaturedImage);
  if (pageCurated?.startsWith('/images/')) return pageCurated;

  const tree = findCollegeInProgramTrees(slug);
  const treeUrl = resolveCollegeImageUrl(slug, tree?.image);
  const cmsUrl = resolveCollegeImageUrl(slug, cmsFeaturedImage);

  if (treeUrl && LOCAL_COLLEGE_IMAGE.test(treeUrl)) return treeUrl;
  if (cmsUrl && LOCAL_COLLEGE_IMAGE.test(cmsUrl)) return cmsUrl;

  if (pageCurated) return pageCurated;

  const resolved = treeUrl ?? cmsUrl;
  if (!resolved) return null;
  // Amplify does not ship most of public/wp-content — avoid broken heroes.
  if (
    resolved.startsWith('/wp-content/') &&
    !LOCAL_COLLEGE_IMAGE.test(resolved)
  ) {
    return null;
  }
  return resolveWpMediaUrl(resolved) ?? resolved;
}

export function isLocalCollegeBanner(url: string | null | undefined): boolean {
  const resolved = resolveWpMediaUrl(url);
  return Boolean(resolved && LOCAL_COLLEGE_IMAGE.test(resolved));
}
