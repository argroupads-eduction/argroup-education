export type NeetCategory =
  | 'general_ews'
  | 'obc_ncl'
  | 'sc'
  | 'st'
  | 'pwd';

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
};

export type NeetPredictorLeadPayload = {
  name: string;
  email: string;
  phone: string;
  city: string;
  category: NeetCategory;
  score: number;
};
