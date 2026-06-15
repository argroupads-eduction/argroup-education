import treeData from '@/data/mbbs-india-tree.json';
import { resolveCollegeImageUrl } from '@/lib/collegeImageIndex';

export type MbbsIndiaCollege = {
  name: string;
  city?: string;
  slug: string | null;
  href: string;
  image?: string | null;
};

export type MbbsIndiaStateColleges = {
  id: string;
  name: string;
  navLabel: string;
  href: string;
  wpSlug: string | null;
  colleges: MbbsIndiaCollege[];
};

export type MbbsIndiaTree = {
  generatedAt: string;
  source: string;
  states: MbbsIndiaStateColleges[];
};

export const MBBS_INDIA_TREE = treeData as MbbsIndiaTree;

function withResolvedCollegeImage(college: MbbsIndiaCollege): MbbsIndiaCollege {
  return {
    ...college,
    image: resolveCollegeImageUrl(college.slug, college.image, college.name),
  };
}

export const MBBS_INDIA_STATES = MBBS_INDIA_TREE.states.map((state) => ({
  ...state,
  colleges: state.colleges.map(withResolvedCollegeImage),
}));

export function getMbbsIndiaStateById(id: string): MbbsIndiaStateColleges | undefined {
  return MBBS_INDIA_STATES.find((s) => s.id === id);
}

export function getMbbsIndiaStateBySlugPart(slugPart: string): MbbsIndiaStateColleges | undefined {
  return MBBS_INDIA_STATES.find((s) => s.id === slugPart);
}

/** Deep-link to home section state tab */
export function mbbsIndiaStateHomeHash(stateId: string): string {
  return `/home#${stateId}`;
}

export function collegeCount(): number {
  return MBBS_INDIA_STATES.reduce((n, s) => n + s.colleges.length, 0);
}
