import cutoffsData from '@/data/neet-ug-college-cutoffs.json';
import { flattenAbroadColleges, MBBS_ABROAD_COUNTRIES } from '@/lib/mbbsAbroadTree';
import { predictNeetRank } from '@backend/lib/neetRankPredictor';
import type { NeetCategory } from './types';

export type CollegeMatch = {
  name: string;
  href: string;
  /** State (India) or country (Abroad) */
  meta: string;
  badge?: string;
  closingRank?: number;
  collegeType?: string;
  chance?: 'high' | 'moderate' | 'reach';
};

export type NeetCollegeRecommendations = {
  india: CollegeMatch[];
  abroad: CollegeMatch[];
  /** State → colleges (India only) */
  byState?: Record<string, CollegeMatch[]>;
  disclaimer?: string;
};

type CutoffCollege = {
  name: string;
  state: string;
  stateId: string;
  type: string;
  closingRankUR: number;
  href: string;
  source?: string;
};

const CUTOFF_COLLEGES = cutoffsData.colleges as CutoffCollege[];

/**
 * Category multipliers on private/deemed UR closing ranks.
 * Reserved categories get more relaxed closing ranks → more colleges become eligible.
 */
const CATEGORY_MULT: Record<NeetCategory, number> = {
  general_ews: 1.0,
  obc_ncl: 1.35,
  sc: 4.2,
  st: 5.8,
  pwd: 3.2,
};

/** Short labels for badges */
const CATEGORY_SHORT: Record<NeetCategory, string> = {
  general_ews: 'General/EWS',
  obc_ncl: 'OBC-NCL',
  sc: 'SC',
  st: 'ST',
  pwd: 'PwD',
};

const TYPE_BADGE: Record<string, string> = {
  aiims: 'AIIMS',
  central: 'Central / INI',
  govt: 'Govt (AIQ)',
  private: 'MBBS',
  deemed: 'MBBS',
};

/** Preferred India state order when eligible for this AIR. */
const INDIA_STATE_PRIORITY: readonly string[] = ['up', 'rajasthan', 'bihar'];

/** AR Group counselling focus: private + deemed inventory (govt/AIIMS excluded). */
const PRIVATE_DEEMED = CUTOFF_COLLEGES.filter(
  (c) => c.type === 'private' || c.type === 'deemed'
);

const PRIVATE_DISCLAIMER =
  'Shortlist uses your NEET AIR and reservation category. Closing ranks are indicative. Fees & counselling rules vary — confirm with AR Group counselling / official portals.';

function closingRankForCategory(urClose: number, category: NeetCategory): number {
  return Math.round(urClose * CATEGORY_MULT[category]);
}

function chanceForRank(air: number, close: number): 'high' | 'moderate' | 'reach' {
  if (air <= close * 0.7) return 'high';
  if (air <= close) return 'moderate';
  return 'reach';
}

function formatCloseBadge(
  close: number,
  chance: 'high' | 'moderate' | 'reach',
  category: NeetCategory
): string {
  const chanceLabel = chance === 'high' ? 'Safe' : chance === 'moderate' ? 'Competitive' : 'Reach';
  return `${CATEGORY_SHORT[category]} · Close ~${close.toLocaleString('en-IN')} · ${chanceLabel}`;
}

/**
 * For strong AIRs, prefer colleges whose closing rank sits near the student
 * (not every open private seat). Soft band scales with AIR so 650 ≠ 550 lists.
 */
function idealCloseForAir(air: number, category: NeetCategory): number {
  const mult = category === 'general_ews' ? 1.35 : category === 'obc_ncl' ? 1.55 : 2.1;
  return Math.max(air * mult, air + 25_000);
}

function statePriorityIndex(stateId: string): number {
  const idx = INDIA_STATE_PRIORITY.indexOf(stateId);
  return idx === -1 ? INDIA_STATE_PRIORITY.length + 50 : idx;
}

/**
 * MBBS India — Private & Deemed only, filtered by AIR + reservation category.
 * State order: UP → Rajasthan → Bihar → rest (only if eligible for this AIR).
 */
function pickIndiaByCutoff(
  air: number,
  category: NeetCategory,
  limit = 48
): { list: CollegeMatch[]; byState: Record<string, CollegeMatch[]> } {
  const idealClose = idealCloseForAir(air, category);

  const scored = PRIVATE_DEEMED.map((c) => {
    const close = closingRankForCategory(c.closingRankUR, category);
    const chance = chanceForRank(air, close);

    // Must clear category-adjusted closing rank (with small buffer)
    const eligible = air <= close * 1.12;

    // Fit: closer to the student's "ideal" close = better shortlist match
    const fit = Math.abs(close - idealClose);
    // Prefer colleges just above AIR (reachable), not far below/above
    const stretch = close < air ? (air - close) * 2 : Math.max(0, close - air * 2.8);
    return { c, close, chance, eligible, fit: fit + stretch };
  }).filter((x) => x.eligible);

  scored.sort((a, b) => {
    // Preferred states first among eligible
    const sa = statePriorityIndex(a.c.stateId);
    const sb = statePriorityIndex(b.c.stateId);
    if (sa !== sb) return sa - sb;

    const chanceOrder = { high: 0, moderate: 1, reach: 2 };
    if (chanceOrder[a.chance] !== chanceOrder[b.chance]) {
      return chanceOrder[a.chance] - chanceOrder[b.chance];
    }
    if (a.fit !== b.fit) return a.fit - b.fit;
    return a.close - b.close;
  });

  // Fallback: if category filter left nothing (very weak AIR), show nearest reachable private
  const pool =
    scored.length > 0
      ? scored
      : PRIVATE_DEEMED.map((c) => {
          const close = closingRankForCategory(c.closingRankUR, category);
          return {
            c,
            close,
            chance: chanceForRank(air, close) as 'high' | 'moderate' | 'reach',
            eligible: true as const,
            fit: Math.abs(close - air),
          };
        })
          .filter((x) => air <= x.close * 1.3 || x.close >= air)
          .sort((a, b) => {
            const sa = statePriorityIndex(a.c.stateId);
            const sb = statePriorityIndex(b.c.stateId);
            if (sa !== sb) return sa - sb;
            return a.fit - b.fit;
          })
          .slice(0, limit);

  const perState = new Map<string, number>();
  const list: CollegeMatch[] = [];
  const byState: Record<string, CollegeMatch[]> = {};
  const maxPerState = category === 'general_ews' || category === 'obc_ncl' ? 6 : 8;

  for (const row of pool) {
    const stateCount = byState[row.c.state]?.length ?? 0;
    if (stateCount >= maxPerState) continue;

    const match: CollegeMatch = {
      name: row.c.name,
      href: row.c.href,
      meta: row.c.state,
      badge: formatCloseBadge(row.close, row.chance, category),
      closingRank: row.close,
      collegeType: TYPE_BADGE[row.c.type] ?? row.c.type,
      chance: row.chance,
    };

    if (!byState[row.c.state]) byState[row.c.state] = [];
    byState[row.c.state]!.push(match);

    if (list.length >= limit) continue;
    const n = perState.get(row.c.stateId) ?? 0;
    perState.set(row.c.stateId, n + 1);
    list.push(match);
  }

  return { list, byState };
}

/**
 * Abroad country order for a given AIR.
 * Always prefer Russia → Georgia → Kazakhstan when that score can still take them
 * (NEET-qualified students can typically apply); then budget destinations.
 */
function abroadCountryOrderForAir(air: number): string[] {
  const priority = ['russia', 'georgia', 'kazakhstan'];
  const mid = ['uzbekistan', 'kyrgyzstan'];
  const value = ['bangladesh', 'nepal', 'philippines'];

  if (air <= 80_000) {
    // Strong profile — premium destinations first, then mid Asia
    return [...priority, ...mid, ...value];
  }
  if (air <= 250_000) {
    return [...priority, ...mid, ...value];
  }
  // Weaker AIR — still Russia/Georgia/Kazakhstan first (AR counselling focus),
  // then more budget-friendly regions.
  return [...priority, 'kyrgyzstan', 'uzbekistan', 'bangladesh', 'nepal', 'philippines'];
}

function abroadCollegesPerCountry(air: number): number {
  if (air <= 80_000) return 4;
  if (air <= 250_000) return 3;
  return 3;
}

/** Abroad — NEET-qualified; country order Russia → Georgia → Kazakhstan → rest. */
function pickAbroadByRank(air: number, limit = 24): CollegeMatch[] {
  const countryOrder = abroadCountryOrderForAir(air);
  const perCountry = abroadCollegesPerCountry(air);
  const out: CollegeMatch[] = [];
  const seen = new Set<string>();

  for (const id of countryOrder) {
    const country = MBBS_ABROAD_COUNTRIES.find((c) => c.id === id);
    if (!country) continue;
    const colleges = flattenAbroadColleges(country).slice(0, perCountry);
    for (const col of colleges) {
      if (!col.href || seen.has(col.href)) continue;
      seen.add(col.href);
      const chance: CollegeMatch['chance'] =
        air <= 100_000 ? 'high' : air <= 300_000 ? 'moderate' : 'reach';
      out.push({
        name: col.name,
        href: col.href,
        meta: country.name,
        badge:
          id === 'russia' || id === 'georgia' || id === 'kazakhstan'
            ? 'Priority destination · NMC pathway'
            : 'NMC pathway · NEET qualified',
        collegeType: 'Abroad',
        chance,
      });
      if (out.length >= limit) return out;
    }
  }

  return out;
}

const MD_MS_CATEGORY_MULT: Record<NeetCategory, number> = {
  general_ews: 1,
  obc_ncl: 1.18,
  sc: 1.65,
  st: 1.9,
  pwd: 2.15,
};

/**
 * Build a broad NEET PG counselling range from the available private/deemed
 * institution inventory. MD/MS cutoffs vary heavily by branch and round, so
 * the UI labels these as indicative ranges rather than official cutoffs.
 */
function indicativePgClosingRank(college: CutoffCollege, category: NeetCategory): number {
  const inventoryMin = 148000;
  const inventorySpan = 202000;
  const qualityBand = Math.max(
    0,
    Math.min(1, (college.closingRankUR - inventoryMin) / inventorySpan)
  );
  const base = college.type === 'deemed' ? 52000 : 34000;
  const spread = college.type === 'deemed' ? 76000 : 66000;
  return Math.round((base + qualityBand * spread) * MD_MS_CATEGORY_MULT[category]);
}

function pickMdMsByRank(
  air: number,
  category: NeetCategory,
  limit = 36
): { list: CollegeMatch[]; byState: Record<string, CollegeMatch[]> } {
  const rows = PRIVATE_DEEMED.map((college) => {
    const close = indicativePgClosingRank(college, category);
    const chance = chanceForRank(air, close);
    return {
      college,
      close,
      chance,
      eligible: air <= close * 1.08,
      fit: Math.abs(close - air * 1.3),
    };
  })
    .filter((row) => row.eligible)
    .sort((a, b) => {
      const chanceOrder = { high: 0, moderate: 1, reach: 2 };
      if (chanceOrder[a.chance] !== chanceOrder[b.chance]) {
        return chanceOrder[a.chance] - chanceOrder[b.chance];
      }
      if (a.fit !== b.fit) return a.fit - b.fit;
      return a.close - b.close;
    });

  const list: CollegeMatch[] = [];
  const byState: Record<string, CollegeMatch[]> = {};
  const perState = new Map<string, number>();
  const maxPerState = 5;

  for (const row of rows) {
    const chanceLabel =
      row.chance === 'high' ? 'Safe range' : row.chance === 'moderate' ? 'Competitive' : 'Reach';
    const match: CollegeMatch = {
      name: row.college.name,
      href: row.college.href,
      meta: row.college.state,
      badge: `${CATEGORY_SHORT[category]} · Indicative PG close ~${row.close.toLocaleString(
        'en-IN'
      )} · ${chanceLabel}`,
      closingRank: row.close,
      collegeType: 'MD/MS',
      chance: row.chance,
    };

    if (!byState[row.college.state]) byState[row.college.state] = [];
    byState[row.college.state]!.push(match);

    const stateCount = perState.get(row.college.state) ?? 0;
    if (stateCount >= maxPerState || list.length >= limit) continue;
    perState.set(row.college.state, stateCount + 1);
    list.push(match);
  }

  return { list, byState };
}

function pickBamsByRank(air: number, category: NeetCategory): CollegeMatch[] {
  // AYUSH / BAMS govt cutoffs are typically much more relaxed than MBBS
  const bamsGovtClose = closingRankForCategory(180000, category);
  const bamsPrivateClose = closingRankForCategory(450000, category);

  const options: CollegeMatch[] = [];

  if (air <= bamsGovtClose) {
    options.push(
      {
        name: 'Government BAMS colleges (state AYUSH counselling)',
        href: '/bams-in-india',
        meta: 'All India / State AYUSH',
        badge: `Govt BAMS often closes ~${bamsGovtClose.toLocaleString('en-IN')}`,
        collegeType: 'BAMS Govt',
        chance: 'high',
        closingRank: bamsGovtClose,
      },
      {
        name: 'BAMS in Uttar Pradesh (state counselling)',
        href: '/bams-in-india',
        meta: 'Uttar Pradesh',
        badge: 'State AYUSH seats',
        collegeType: 'BAMS',
        chance: air <= bamsGovtClose * 0.8 ? 'high' : 'moderate',
      },
      {
        name: 'BAMS in Karnataka / Maharashtra / Rajasthan',
        href: '/bams-in-india',
        meta: 'Multiple states',
        badge: 'State quota options',
        collegeType: 'BAMS',
        chance: 'moderate',
      }
    );
  }

  if (air <= bamsPrivateClose) {
    options.push({
      name: 'BAMS colleges (state & management seats)',
      href: '/bams-in-india',
      meta: 'Pan India',
      badge: `Seats often open till ~${bamsPrivateClose.toLocaleString('en-IN')}`,
      collegeType: 'BAMS',
      chance: 'high',
      closingRank: bamsPrivateClose,
    });
  }

  if (!options.length) {
    options.push({
      name: 'BAMS counselling guidance',
      href: '/bams-in-india',
      meta: 'AYUSH',
      badge: 'Talk to counsellor for seat & fee options',
      collegeType: 'BAMS',
      chance: 'reach',
    });
  }

  return options;
}

export type PredictorTrack = 'india' | 'abroad' | 'md-ms' | 'bams';

export function getCollegeRecommendations(
  category: NeetCategory,
  score: number,
  expectedRank?: number,
  track: PredictorTrack = 'india',
  limit = 24
): NeetCollegeRecommendations {
  const air = expectedRank ?? predictNeetRank(category, score).expectedRank;
  return getCollegeRecommendationsByRank(air, category, limit, track);
}

/** Match colleges from a known AIR (College Predictor) or predicted AIR (Rank Predictor). */
export function getCollegeRecommendationsByRank(
  air: number,
  category: NeetCategory = 'general_ews',
  limit = 24,
  track: PredictorTrack = 'india'
): NeetCollegeRecommendations {
  const safeAir = Number.isFinite(air) && air > 0 ? Math.round(air) : 1;

  if (track === 'abroad') {
    return {
      india: [],
      abroad: pickAbroadByRank(safeAir, limit),
      disclaimer:
        'MBBS Abroad: NEET qualification is typically required. Fees, FMGE/NExT pathway and NMC recognition vary by university — confirm with counselling.',
    };
  }

  if (track === 'md-ms') {
    const { list, byState } = pickMdMsByRank(safeAir, category, limit);
    return {
      india: list,
      abroad: [],
      byState,
      disclaimer:
        `MD/MS matches use NEET PG AIR and ${CATEGORY_SHORT[category]}. Ranges are indicative because final cutoff changes by specialty, quota, counselling round and seat type — confirm the exact branch with official counselling / AR Group.`,
    };
  }

  if (track === 'bams') {
    return {
      india: pickBamsByRank(safeAir, category),
      abroad: [],
      disclaimer:
        'BAMS seats are allotted via AYUSH / state counselling. Cutoffs below are indicative — verify on AACCC / state portals.',
    };
  }

  const { list, byState } = pickIndiaByCutoff(safeAir, category, limit);

  const stateNameToId = new Map<string, string>();
  for (const c of PRIVATE_DEEMED) {
    if (!stateNameToId.has(c.state)) stateNameToId.set(c.state, c.stateId);
  }

  // Flatten in preferred state order (UP → Rajasthan → Bihar → rest)
  const stateOrder = Object.keys(byState).sort((a, b) => {
    const pa = statePriorityIndex(stateNameToId.get(a) ?? '');
    const pb = statePriorityIndex(stateNameToId.get(b) ?? '');
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b);
  });

  const byStateFlat: CollegeMatch[] = [];
  for (const state of stateOrder) {
    byStateFlat.push(...(byState[state] ?? []));
  }

  const catLabel = CATEGORY_SHORT[category];
  return {
    india: byStateFlat.length ? byStateFlat.slice(0, Math.max(limit, 48)) : list,
    abroad: [],
    byState,
    disclaimer: `${PRIVATE_DISCLAIMER} Filtered for ${catLabel} with AIR ${safeAir.toLocaleString('en-IN')}.`,
  };
}
