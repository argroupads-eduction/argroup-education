import type { NeetCategory } from './types';

export const NEET_EXAM_YEAR_LABEL = 'NEET 2026 — Expected marks vs rank';

export const NEET_CATEGORIES: {
  id: NeetCategory;
  label: string;
  cutoffHint: string;
}[] = [
  { id: 'general_ews', label: 'General / EWS', cutoffHint: '164+' },
  { id: 'obc_ncl', label: 'OBC-NCL', cutoffHint: '146+' },
  { id: 'sc', label: 'SC', cutoffHint: '129+' },
  { id: 'st', label: 'ST', cutoffHint: '129+' },
  { id: 'pwd', label: 'PwD', cutoffHint: '129+' },
];

/**
 * NEET 2026 expected marks vs AIR (normalized from recent NTA trends + rank inflation).
 * Source basis: Careers360 / Vedantu 2026 projections; updated for higher competition at 600+.
 */
export const MARKS_VS_RANK = [
  { minMarks: 715, maxMarks: 720, minRank: 1, maxRank: 10 },
  { minMarks: 700, maxMarks: 714, minRank: 10, maxRank: 300 },
  { minMarks: 680, maxMarks: 699, minRank: 300, maxRank: 2500 },
  { minMarks: 650, maxMarks: 679, minRank: 2500, maxRank: 12000 },
  { minMarks: 620, maxMarks: 649, minRank: 12000, maxRank: 30000 },
  { minMarks: 590, maxMarks: 619, minRank: 30000, maxRank: 60000 },
  { minMarks: 560, maxMarks: 589, minRank: 60000, maxRank: 100000 },
  { minMarks: 530, maxMarks: 559, minRank: 100000, maxRank: 160000 },
  { minMarks: 500, maxMarks: 529, minRank: 160000, maxRank: 230000 },
  { minMarks: 470, maxMarks: 499, minRank: 230000, maxRank: 320000 },
  { minMarks: 430, maxMarks: 469, minRank: 320000, maxRank: 480000 },
  { minMarks: 390, maxMarks: 429, minRank: 480000, maxRank: 680000 },
  { minMarks: 350, maxMarks: 389, minRank: 680000, maxRank: 900000 },
  { minMarks: 300, maxMarks: 349, minRank: 900000, maxRank: 1150000 },
  { minMarks: 250, maxMarks: 299, minRank: 1150000, maxRank: 1450000 },
  { minMarks: 200, maxMarks: 249, minRank: 1450000, maxRank: 1750000 },
  { minMarks: 150, maxMarks: 199, minRank: 1750000, maxRank: 2000000 },
  { minMarks: 100, maxMarks: 149, minRank: 2000000, maxRank: 2200000 },
  { minMarks: 0, maxMarks: 99, minRank: 2200000, maxRank: 2300000 },
] as const;

export const NEET_2026_MAX_RANK = 2_300_000;

export const RANK_VS_COLLEGE = [
  { maxRank: 1000, label: 'AIIMS, JIPMER, top government medical colleges' },
  { maxRank: 5000, label: 'Top government medical colleges, AIIMS newer campuses' },
  { maxRank: 15000, label: 'Good government medical colleges, state quota MBBS options' },
  { maxRank: 30000, label: 'Government colleges in some states and selected private MBBS colleges' },
  { maxRank: 60000, label: 'Private medical colleges and some BDS colleges' },
  { maxRank: 100000, label: 'Private MBBS, BDS and allied medical courses' },
  { maxRank: Infinity, label: 'BDS, BAMS, BHMS and private medical college options' },
] as const;

export const MARKS_VS_RANK_TABLE = [
  { marks: '715 – 720', rank: '1 – 10' },
  { marks: '700 – 714', rank: '10 – 300' },
  { marks: '680 – 699', rank: '300 – 2,500' },
  { marks: '650 – 679', rank: '2,500 – 12,000' },
  { marks: '620 – 649', rank: '12,000 – 30,000' },
  { marks: '590 – 619', rank: '30,000 – 60,000' },
  { marks: '560 – 589', rank: '60,000 – 1,00,000' },
  { marks: '530 – 559', rank: '1,00,000 – 1,60,000' },
  { marks: '500 – 529', rank: '1,60,000 – 2,30,000' },
  { marks: '470 – 499', rank: '2,30,000 – 3,20,000' },
  { marks: '430 – 469', rank: '3,20,000 – 4,80,000' },
  { marks: '390 – 429', rank: '4,80,000 – 6,80,000' },
  { marks: '350 – 389', rank: '6,80,000 – 9,00,000' },
  { marks: '300 – 349', rank: '9,00,000 – 11,50,000' },
  { marks: '250 – 299', rank: '11,50,000 – 14,50,000' },
  { marks: '200 – 249', rank: '14,50,000 – 17,50,000' },
  { marks: '150 – 199', rank: '17,50,000 – 20,00,000' },
  { marks: '100 – 149', rank: '20,00,000 – 22,00,000' },
  { marks: 'Below 100', rank: '22,00,000+' },
] as const;

export const PERCENTILE_VS_RANK_TABLE = [
  { percentile: '99.99+', rank: '1 to 50' },
  { percentile: '99.9', rank: '50 to 500' },
  { percentile: '99.5', rank: '500 to 2,500' },
  { percentile: '99', rank: '2,500 to 8,000' },
  { percentile: '98', rank: '8,000 to 18,000' },
  { percentile: '97', rank: '18,000 to 30,000' },
  { percentile: '95', rank: '30,000 to 50,000' },
  { percentile: '90', rank: '50,000 to 80,000' },
  { percentile: '85', rank: '80,000 to 1,20,000' },
  { percentile: '80', rank: '1,20,000 to 1,50,000' },
  { percentile: '70', rank: '1,50,000 to 2,00,000' },
  { percentile: 'Below 70', rank: 'Above 2,00,000' },
] as const;

export const CATEGORY_CUTOFF_TABLE = [
  { category: 'General UR', percentile: '50th', marks: '686 to 144' },
  { category: 'EWS', percentile: '50th', marks: '686 to 144' },
  { category: 'OBC', percentile: '40th', marks: '143 to 113' },
  { category: 'SC', percentile: '40th', marks: '143 to 113' },
  { category: 'ST', percentile: '40th', marks: '143 to 113' },
  { category: 'UR PwD', percentile: '45th', marks: '143 to 127' },
  { category: 'OBC/SC/ST PwD', percentile: '40th', marks: '126 to 113' },
] as const;

export const NEET_PREDICTOR_FAQ = [
  {
    q: 'What is the NEET rank predictor by marks?',
    a: 'It uses your expected NEET score and compares it with previous year marks vs rank data to estimate your All India Rank (AIR) and college admission chances.',
  },
  {
    q: 'How accurate is this NEET Rank Predictor?',
    a: 'Predictions use NEET 2026 expected marks-vs-rank trends (normalized from recent NTA data). Actual ranks depend on exam difficulty, candidates, and score distribution — use as a planning guide.',
  },
  {
    q: 'Is there any charge for the NEET rank predictor?',
    a: 'No charge for using the tool. Enter your category, score, and contact details to unlock your rank range, percentile, and MBBS India / Abroad college matches.',
  },
  {
    q: 'Does it work category-wise (General, OBC, SC, ST)?',
    a: 'Yes. Select your reservation category for qualifying cutoff context. AIR from marks follows the same national trend; admission cutoffs vary by category and quota.',
  },
] as const;

export const HOW_TO_STEPS = [
  {
    step: '01',
    title: 'Enter score & pathway',
    text: 'Choose MBBS India, Abroad, or both. Pick category and enter your 3-digit NEET score.',
  },
  {
    step: '02',
    title: 'Share your details',
    text: 'Add name, mobile, email, and city so our counsellors can send your personalised college list.',
  },
  {
    step: '03',
    title: 'Get rank & colleges',
    text: 'Instant expected AIR range, percentile, and matched MBBS colleges — plan counselling with AR Group.',
  },
] as const;

export function categoryLabel(id: NeetCategory): string {
  return NEET_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
