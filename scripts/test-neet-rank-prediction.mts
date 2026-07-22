/**
 * Standalone check: NEET score → AIR must vary continuously with score.
 * Run: npx tsx scripts/test-neet-rank-prediction.mts
 */
import { predictNeetRank } from '../apps/backend/src/lib/neetRankPredictor/index.ts';
import { airFromDataset } from '../apps/backend/src/lib/neetRankPredictor/predictor/lookup.ts';
import { getPrimaryDataset } from '../apps/backend/src/lib/neetRankPredictor/data/registry.ts';

const scores = [650, 550, 450, 350, 250] as const;

console.log('score\trank\t(best–worst)');
const ranks: number[] = [];
for (const score of scores) {
  const p = predictNeetRank('general_ews', score);
  ranks.push(p.expectedRank);
  console.log(`${score}\t${p.expectedRank}\t(${p.bestRank}–${p.worstRank})`);
}

const monoOk = ranks.every((r, i) => i === 0 || ranks[i - 1]! < r);
const uniqueOk = new Set(ranks).size === ranks.length;

// Ballpark vs MARKS_VS_RANK_TABLE
const checks = [
  { score: 686, min: 1, max: 5 },
  { score: 450, min: 120_000, max: 200_000 },
  { score: 300, min: 300_000, max: 450_000 },
];
console.log('\nballpark checks:');
let ballparkOk = true;
for (const c of checks) {
  const rank = predictNeetRank('general_ews', c.score).expectedRank;
  const ok = rank >= c.min && rank <= c.max;
  ballparkOk = ballparkOk && ok;
  console.log(`  ${c.score} → ${rank} (expect ${c.min}–${c.max}) ${ok ? 'OK' : 'FAIL'}`);
}

// Continuity across former gap 509↔516
const d = getPrimaryDataset();
const bridge = [516, 515, 514, 513, 512, 511, 510, 509].map((s) => ({
  s,
  r: airFromDataset(d, s),
}));
console.log('\nbridge 516→509 (must be monotone increasing rank):');
for (const row of bridge) console.log(`  ${row.s} → ${row.r}`);
const bridgeOk = bridge.every((row, i) => i === 0 || bridge[i - 1]!.r <= row.r);

console.log('\n---');
console.log('monotone (higher score → better/lower rank):', monoOk ? 'PASS' : 'FAIL');
console.log('all ranks unique:', uniqueOk ? 'PASS' : 'FAIL');
console.log('MARKS table ballpark:', ballparkOk ? 'PASS' : 'FAIL');
console.log('509–516 bridge monotone:', bridgeOk ? 'PASS' : 'FAIL');

if (!monoOk || !uniqueOk || !ballparkOk || !bridgeOk) process.exit(1);
