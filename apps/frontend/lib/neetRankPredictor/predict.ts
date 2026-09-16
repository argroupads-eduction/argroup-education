/** Re-export backend NEET predictor — all logic lives in apps/backend */
export { predictNeetRank, formatRank } from '@backend/lib/neetRankPredictor';
export type { NeetRankPrediction, NeetCategory } from '@backend/lib/neetRankPredictor';
