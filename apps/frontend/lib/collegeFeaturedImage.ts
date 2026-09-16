import { resolveCollegeImageUrl } from '@/lib/collegeImageIndex';
import { findCollegeProgramEntry } from '@/lib/collegeProgramLookup';
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
  const tree = findCollegeInProgramTrees(slug);
  const treeUrl = resolveCollegeImageUrl(slug, tree?.image);
  const cmsUrl = resolveCollegeImageUrl(slug, cmsFeaturedImage);

  if (treeUrl && LOCAL_COLLEGE_IMAGE.test(treeUrl)) return treeUrl;
  if (cmsUrl && LOCAL_COLLEGE_IMAGE.test(cmsUrl)) return cmsUrl;

  return treeUrl ?? cmsUrl;
}

export function isLocalCollegeBanner(url: string | null | undefined): boolean {
  const resolved = resolveWpMediaUrl(url);
  return Boolean(resolved && LOCAL_COLLEGE_IMAGE.test(resolved));
}
