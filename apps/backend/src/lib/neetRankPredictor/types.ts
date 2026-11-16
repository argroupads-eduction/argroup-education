export type NeetCategory =
  | 'general_ews'
  | 'obc_ncl'
  | 'sc'
  | 'st'
  | 'pwd';

export type DifficultyLabel = 'easy' | 'moderate' | 'hard' | 'very_hard';

export type NeetYearDataset = {
  year: number;
  source: string;
  totalAppeared: number;
  totalQualified: number;
  maxScore: number;
  difficulty: DifficultyLabel;
  difficultyScore: number;
  /** Sorted descending by marks */
  anchors: readonly { marks: number; air: number }[];
  qualifyingMarks: Record<NeetCategory, number>;
};

export type NeetRankPrediction = {
  category: NeetCategory;
  categoryLabel: string;
  score: number;
  bestRank: number;
  expectedRank: number;
  worstRank: number;
  percentile: number;
  percentileLabel: string;
  collegeChances: string;
  qualifyingNote: string;
  dataYear: number;
  dataSource: string;
  confidence: 'high' | 'medium' | 'low';
  referenceYears: number[];
};

export type CollegeMatch = {
  name: string;
  href: string;
  meta: string;
  badge?: string;
  admissionProbability?: string;
};

export type NeetCollegeRecommendations = {
  india: CollegeMatch[];
  abroad: CollegeMatch[];
};
