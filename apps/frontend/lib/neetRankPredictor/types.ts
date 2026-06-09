export type { NeetCategory, NeetRankPrediction } from '@backend/lib/neetRankPredictor/types';

export type NeetPredictorLeadPayload = {
  name: string;
  email: string;
  phone: string;
  city: string;
  category: import('@backend/lib/neetRankPredictor/types').NeetCategory;
  score: number;
};
