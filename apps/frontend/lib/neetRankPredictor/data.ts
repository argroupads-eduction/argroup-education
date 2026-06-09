import type { NeetCategory } from './types';
import { getPrimaryDataset } from '@backend/lib/neetRankPredictor/data/registry';
import { NEET_2025 } from '@backend/lib/neetRankPredictor/data/years/2025';

export const NEET_EXAM_YEAR_LABEL = 'NEET 2026 expected rank (coaching trend)';

export const NEET_CATEGORIES: {
  id: NeetCategory;
  label: string;
  cutoffHint: string;
}[] = [
  { id: 'general_ews', label: 'General / EWS', cutoffHint: '144+' },
  { id: 'obc_ncl', label: 'OBC-NCL', cutoffHint: '129+' },
  { id: 'sc', label: 'SC', cutoffHint: '129+' },
  { id: 'st', label: 'ST', cutoffHint: '129+' },
  { id: 'pwd', label: 'PwD', cutoffHint: '129+' },
];

export const NEET_2026_MAX_RANK = getPrimaryDataset().totalAppeared;

export const RANK_VS_COLLEGE = [
  { maxRank: 100, label: 'AIIMS Delhi, top AIIMS (AIR under 100)' },
  { maxRank: 1500, label: 'All AIIMS, JIPMER, CMC Vellore, top government colleges' },
  { maxRank: 11000, label: 'Strong government MBBS, top state quota options' },
  { maxRank: 40000, label: 'Government MBBS via state quota; competitive private options' },
  { maxRank: 70000, label: 'Private MBBS, BDS government seats in select states' },
  { maxRank: 130000, label: 'Private MBBS, BDS, and allied medical courses' },
  { maxRank: Infinity, label: 'BDS, BAMS, BHMS, MBBS abroad and allied programmes' },
] as const;

export const MARKS_VS_RANK_TABLE = [
  { marks: '686', rank: '1' },
  { marks: '650 – 600', rank: '72 – 1,259' },
  { marks: '600 – 550', rank: '1,260 – 10,659' },
  { marks: '550 – 500', rank: '46,754 – 85,025' },
  { marks: '500 – 450', rank: '76,500 – 1,33,916' },
  { marks: '450 – 400', rank: '1,33,919 – 1,93,032' },
  { marks: '400 – 350', rank: '1,93,048 – 2,63,339' },
  { marks: '350 – 340', rank: '2,48,480 – 2,78,814' },
  { marks: '340 – 300', rank: '2,78,863 – 3,46,064' },
  { marks: '300 – 250', rank: '3,28,382 – 4,43,570' },
  { marks: 'Below 250', rank: '4,43,570+' },
] as const;

export const PERCENTILE_VS_RANK_TABLE = [
  { percentile: '99.999+', rank: '1 to 10' },
  { percentile: '99.99+', rank: '10 to 100' },
  { percentile: '99.9+', rank: '100 to 1,500' },
  { percentile: '99.5+', rank: '1,500 to 11,000' },
  { percentile: '99+', rank: '11,000 to 40,000' },
  { percentile: '98+', rank: '40,000 to 70,000' },
  { percentile: '95+', rank: '70,000 to 1,30,000' },
  { percentile: '90+', rank: '1,30,000 to 2,00,000' },
  { percentile: 'Below 90', rank: 'Above 2,00,000' },
] as const;

export const CATEGORY_CUTOFF_TABLE = [
  { category: 'General / EWS', percentile: '50th', marks: `${NEET_2025.qualifyingMarks.general_ews}+` },
  { category: 'OBC-NCL', percentile: '40th', marks: `${NEET_2025.qualifyingMarks.obc_ncl}+` },
  { category: 'SC / ST', percentile: '40th', marks: `${NEET_2025.qualifyingMarks.sc}+` },
  { category: 'PwD', percentile: '40th', marks: `${NEET_2025.qualifyingMarks.pwd}+` },
] as const;

export const NEET_PREDICTOR_FAQ = [
  {
    q: 'What is the NEET rank predictor by marks?',
    a: 'It maps your NEET score to an estimated All India Rank (AIR) using NEET 2026 expected rank trends from Collegedunia, Shiksha, and coaching consensus, the same ranges students see on coaching portals and when asking ChatGPT.',
  },
  {
    q: 'How accurate is this NEET Rank Predictor?',
    a: 'Expected rank follows coaching-portal 2026 trends (Collegedunia / Shiksha mark bands). Example: 444 marks ≈ AIR 85,000–1,00,000; 344 marks ≈ AIR 2,40,000–2,55,000. Results align with what coaching sites and ChatGPT typically show for the same score.',
  },
  {
    q: 'Is there any charge for the NEET rank predictor?',
    a: 'No charge. Enter your category, score, and contact details to get your AIR estimate, percentile, and MBBS India / Abroad college matches.',
  },
  {
    q: 'Does it work category-wise (General, OBC, SC, ST)?',
    a: 'AIR is the same for all categories at a given score. Your category affects qualifying cutoff and admission quotas, select it for personalised counselling context.',
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
    text: 'Instant AIR estimate from NTA 2025 data, percentile, and matched MBBS colleges, plan counselling with AR Group.',
  },
] as const;

export function categoryLabel(id: NeetCategory): string {
  return NEET_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
