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

/**
 * For strong AIRs, General/OBC still prefer stronger private colleges.
 * SC/ST/PwD see a wider private pool even at the same AIR.
 */
const PREMIUM_UR_CAP: Record<NeetCategory, number> = {
  general_ews: 240000,
  obc_ncl: 300000,
  sc: 520000,
  st: 580000,
  pwd: 450000,
};

const TYPE_BADGE: Record<string, string> = {
  aiims: 'AIIMS',
  central: 'Central / INI',
  govt: 'Govt (AIQ)',
  private: 'MBBS',
  deemed: 'MBBS',
};

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
 * MBBS India — Private & Deemed only, filtered by AIR + reservation category.
 */
function pickIndiaByCutoff(
  air: number,
  category: NeetCategory,
  limit = 48
): { list: CollegeMatch[]; byState: Record<string, CollegeMatch[]> } {
  const premiumCap = PREMIUM_UR_CAP[category];
  const strongAir = air <= 80000;

  const scored = PRIVATE_DEEMED.map((c) => {
    const close = closingRankForCategory(c.closingRankUR, category);
    const chance = chanceForRank(air, close);

    // Must clear category-adjusted closing rank (with small buffer)
    let eligible = air <= close * 1.1;

    // Strong AIR + General/OBC: keep list to better private/deemed (not every open college)
    if (eligible && strongAir && c.closingRankUR > premiumCap) {
      eligible = false;
    }

    // Fit: prefer colleges whose category close sits just above the student's AIR
    const idealClose = air * (category === 'general_ews' ? 2.2 : category === 'obc_ncl' ? 2.8 : 4.5);
    const fit = Math.abs(close - idealClose);

    return { c, close, chance, eligible, fit };
  }).filter((x) => x.eligible);

  scored.sort((a, b) => {
    const chanceOrder = { high: 0, moderate: 1, reach: 2 };
    if (chanceOrder[a.chance] !== chanceOrder[b.chance]) {
      return chanceOrder[a.chance] - chanceOrder[b.chance];
    }
    // Deemed slightly ahead of private within same chance
    const typeOrder = (t: string) => (t === 'deemed' ? 0 : 1);
    if (typeOrder(a.c.type) !== typeOrder(b.c.type)) {
      return typeOrder(a.c.type) - typeOrder(b.c.type);
    }
    // Best fit for this AIR + category
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
          .filter((x) => air <= x.close * 1.25 || x.close >= air)
          .sort((a, b) => a.fit - b.fit)
          .slice(0, limit);

  const perState = new Map<string, number>();
  const list: CollegeMatch[] = [];
  const byState: Record<string, CollegeMatch[]> = {};
  const maxPerState = category === 'general_ews' || category === 'obc_ncl' ? 5 : 7;

  for (const row of pool) {
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

    const n = perState.get(row.c.state) ?? 0;
    if (n >= maxPerState) continue;
    if (list.length >= limit) continue;
    perState.set(row.c.state, n + 1);
    list.push(match);
  }

  return { list, byState };
}

/** Abroad — NEET-qualified students can apply; country tiers by competitiveness of India options. */
function pickAbroadByRank(air: number, limit = 12): CollegeMatch[] {
  // Lower AIR → still show premium destinations; higher AIR → value/budget first
  let countryOrder: string[];
  if (air <= 50000) {
    countryOrder = ['georgia', 'russia', 'kazakhstan', 'uzbekistan', 'kyrgyzstan', 'bangladesh', 'nepal'];
  } else if (air <= 200000) {
    countryOrder = ['georgia', 'kazakhstan', 'uzbekistan', 'kyrgyzstan', 'russia', 'bangladesh', 'nepal', 'philippines'];
  } else {
    countryOrder = ['kyrgyzstan', 'uzbekistan', 'bangladesh', 'nepal', 'kazakhstan', 'georgia', 'philippines', 'russia'];
  }

  const out: CollegeMatch[] = [];
  const seen = new Set<string>();

  for (const id of countryOrder) {
    const country = MBBS_ABROAD_COUNTRIES.find((c) => c.id === id);
    if (!country) continue;
    const colleges = flattenAbroadColleges(country).slice(0, 3);
    for (const col of colleges) {
      if (!col.href || seen.has(col.href)) continue;
      seen.add(col.href);
      out.push({
        name: col.name,
        href: col.href,
        meta: country.name,
        badge: 'NMC pathway · NEET qualified',
        collegeType: 'Abroad',
        chance: air <= 200000 ? 'high' : 'moderate',
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
  const byStateFlat = Object.values(byState)
    .flat()
    .sort((a, b) => {
      const chanceOrder = { high: 0, moderate: 1, reach: 2 };
      const ca = chanceOrder[a.chance ?? 'moderate'];
      const cb = chanceOrder[b.chance ?? 'moderate'];
      if (ca !== cb) return ca - cb;
      return (a.closingRank ?? 0) - (b.closingRank ?? 0);
    });

  const catLabel = CATEGORY_SHORT[category];
  return {
    india: byStateFlat.length ? byStateFlat.slice(0, Math.max(limit, 48)) : list,
    abroad: [],
    byState,
    disclaimer: `${PRIVATE_DISCLAIMER} Filtered for ${catLabel} with AIR ${safeAir.toLocaleString('en-IN')}.`,
  };
}
