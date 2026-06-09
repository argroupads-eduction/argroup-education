import { flattenAbroadColleges, MBBS_ABROAD_COUNTRIES } from '@/lib/mbbsAbroadTree';
import { MBBS_INDIA_STATES } from '@/lib/mbbsIndiaTree';
import { predictNeetRank } from '@backend/lib/neetRankPredictor';
import type { NeetCategory } from './types';

export type CollegeMatch = {
  name: string;
  href: string;
  meta: string;
  badge?: string;
};

export type NeetCollegeRecommendations = {
  india: CollegeMatch[];
  abroad: CollegeMatch[];
};

const INDIA_PRIORITY = [
  'aiims',
  'jipmer',
  'maulana',
  'kgmu',
  'king george',
  'seth gs',
  'lady hardinge',
  'mamc',
  'grant medical',
  'b.j.',
  'bj medical',
];

function indiaTierByRank(air: number): 'elite' | 'competitive' | 'broad' | 'abroad_focus' {
  if (air <= 1500) return 'elite';
  if (air <= 40000) return 'competitive';
  if (air <= 130000) return 'broad';
  return 'abroad_focus';
}

function abroadTierByRank(air: number): 'premium' | 'value' | 'budget' {
  if (air <= 11000) return 'premium';
  if (air <= 70000) return 'value';
  return 'budget';
}

function pickIndiaColleges(air: number, limit = 6): CollegeMatch[] {
  const tier = indiaTierByRank(air);
  const all = MBBS_INDIA_STATES.flatMap((state) =>
    state.colleges.map((c) => ({
      name: c.name,
      href: c.href,
      meta: state.name,
      slug: (c.slug ?? c.name).toLowerCase(),
    }))
  );

  const priority = all.filter((c) =>
    INDIA_PRIORITY.some((p) => c.name.toLowerCase().includes(p) || c.slug.includes(p.replace(/\s/g, '')))
  );

  if (tier === 'elite') {
    return (priority.length ? priority : all.slice(0, limit)).slice(0, limit).map(({ name, href, meta }) => ({
      name,
      href,
      meta,
      badge: 'Top tier',
    }));
  }

  if (tier === 'competitive') {
    const govt = all.filter(
      (c) =>
        /government|govt|medical college|institute/i.test(c.name) &&
        !/private|deemed/i.test(c.name)
    );
    const pool = [...priority, ...govt, ...all];
    const seen = new Set<string>();
    const out: CollegeMatch[] = [];
    for (const c of pool) {
      if (seen.has(c.href)) continue;
      seen.add(c.href);
      out.push({ name: c.name, href: c.href, meta: c.meta, badge: 'Govt / competitive' });
      if (out.length >= limit) break;
    }
    return out;
  }

  if (tier === 'broad') {
    return all
      .filter((c) => /medical|college|institute|university/i.test(c.name))
      .slice(0, limit)
      .map((c) => ({ name: c.name, href: c.href, meta: c.meta, badge: 'State options' }));
  }

  return all.slice(0, 4).map((c) => ({
    name: c.name,
    href: c.href,
    meta: c.meta,
    badge: 'Explore India',
  }));
}

const ABROAD_BY_TIER: Record<'premium' | 'value' | 'budget', string[]> = {
  premium: ['georgia', 'russia', 'kazakhstan'],
  value: ['kyrgyzstan', 'uzbekistan', 'georgia', 'kazakhstan', 'bangladesh'],
  budget: ['kyrgyzstan', 'uzbekistan', 'bangladesh', 'nepal', 'kazakhstan'],
};

function pickAbroadColleges(air: number, limit = 6): CollegeMatch[] {
  const tier = abroadTierByRank(air);
  const countryIds = ABROAD_BY_TIER[tier];
  const out: CollegeMatch[] = [];
  const seen = new Set<string>();

  for (const id of countryIds) {
    const country = MBBS_ABROAD_COUNTRIES.find((c) => c.id === id);
    if (!country) continue;
    const colleges = flattenAbroadColleges(country).slice(0, 2);
    for (const col of colleges) {
      if (!col.href || seen.has(col.href)) continue;
      seen.add(col.href);
      out.push({
        name: col.name,
        href: col.href,
        meta: country.name,
        badge: tier === 'budget' ? 'Affordable abroad' : 'NMC recognised',
      });
      if (out.length >= limit) break;
    }
    if (out.length >= limit) break;
  }

  if (out.length < 3) {
    for (const country of MBBS_ABROAD_COUNTRIES) {
      const col = flattenAbroadColleges(country)[0];
      if (!col?.href || seen.has(col.href)) continue;
      seen.add(col.href);
      out.push({ name: col.name, href: col.href, meta: country.name });
      if (out.length >= limit) break;
    }
  }

  return out;
}

export function getCollegeRecommendations(
  _category: NeetCategory,
  score: number,
  expectedRank?: number
): NeetCollegeRecommendations {
  const air = expectedRank ?? predictNeetRank('general_ews', score).expectedRank;
  return {
    india: pickIndiaColleges(air),
    abroad: pickAbroadColleges(air),
  };
}
