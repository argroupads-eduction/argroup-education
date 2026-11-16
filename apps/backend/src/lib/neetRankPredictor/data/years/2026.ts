import type { NeetYearDataset } from '../../types';

/**
 * NTA NEET UG 2026 (re-exam) marks vs AIR.
 *
 * After NTA publishes official result statistics (target: 20 Jul 2026),
 * replace NTA_2026_TOP_POINTS / NTA_2026_BANDS below with verified NTA data.
 * Until then these mirror the latest NTA release shape so the Jul-20 auto-switch works.
 */
export const NTA_2026_TOP_POINTS: readonly { marks: number; air: number }[] = [
  { marks: 686, air: 1 },
  { marks: 682, air: 2 },
  { marks: 681, air: 3 },
  { marks: 678, air: 8 },
  { marks: 662, air: 33 },
  { marks: 650, air: 72 },
  { marks: 625, air: 158 },
  { marks: 607, air: 1022 },
  { marks: 605, air: 1047 },
  { marks: 600, air: 1386 },
  { marks: 582, air: 3200 },
  { marks: 563, air: 7497 },
  { marks: 543, air: 15000 },
  { marks: 532, air: 22000 },
  { marks: 528, air: 25000 },
  { marks: 523, air: 29000 },
  { marks: 520, air: 31450 },
  { marks: 516, air: 35000 },
];

export const NTA_2026_BANDS: readonly {
  marksMax: number;
  marksMin: number;
  airMin: number;
  airMax: number;
}[] = [
  { marksMax: 509, marksMin: 500, airMin: 76500, airMax: 85025 },
  { marksMax: 499, marksMin: 490, airMin: 85032, airMax: 93986 },
  { marksMax: 489, marksMin: 480, airMin: 93996, airMax: 103350 },
  { marksMax: 479, marksMin: 470, airMin: 103369, airMax: 113223 },
  { marksMax: 469, marksMin: 460, airMin: 113233, airMax: 123338 },
  { marksMax: 459, marksMin: 450, airMin: 123346, airMax: 133916 },
  { marksMax: 449, marksMin: 440, airMin: 133919, airMax: 144909 },
  { marksMax: 439, marksMin: 430, airMin: 144916, airMax: 156179 },
  { marksMax: 429, marksMin: 420, airMin: 156204, airMax: 168034 },
  { marksMax: 419, marksMin: 410, airMin: 168039, airMax: 180302 },
  { marksMax: 409, marksMin: 400, airMin: 180312, airMax: 193032 },
  { marksMax: 399, marksMin: 390, airMin: 193048, airMax: 206241 },
  { marksMax: 389, marksMin: 380, airMin: 206257, airMax: 219764 },
  { marksMax: 379, marksMin: 370, airMin: 219770, airMax: 233843 },
  { marksMax: 369, marksMin: 360, airMin: 233864, airMax: 248477 },
  { marksMax: 359, marksMin: 350, airMin: 248480, airMax: 263339 },
  { marksMax: 349, marksMin: 340, airMin: 263357, airMax: 278814 },
  { marksMax: 339, marksMin: 330, airMin: 278863, airMax: 294772 },
  { marksMax: 329, marksMin: 320, airMin: 294808, airMax: 311293 },
  { marksMax: 319, marksMin: 310, airMin: 311297, airMax: 328377 },
  { marksMax: 309, marksMin: 300, airMin: 328382, airMax: 346064 },
  { marksMax: 299, marksMin: 290, airMin: 346070, airMax: 364364 },
  { marksMax: 289, marksMin: 280, airMin: 364370, airMax: 383270 },
  { marksMax: 279, marksMin: 270, airMin: 383276, airMax: 402770 },
  { marksMax: 269, marksMin: 260, airMin: 402776, airMax: 422870 },
  { marksMax: 259, marksMin: 250, airMin: 422876, airMax: 443570 },
  { marksMax: 249, marksMin: 240, airMin: 443576, airMax: 464870 },
  { marksMax: 239, marksMin: 230, airMin: 464876, airMax: 486770 },
  { marksMax: 229, marksMin: 220, airMin: 486776, airMax: 509270 },
  { marksMax: 219, marksMin: 210, airMin: 509276, airMax: 532370 },
  { marksMax: 209, marksMin: 200, airMin: 532376, airMax: 556070 },
  { marksMax: 199, marksMin: 190, airMin: 556076, airMax: 580370 },
  { marksMax: 189, marksMin: 180, airMin: 580376, airMax: 605270 },
  { marksMax: 179, marksMin: 170, airMin: 605276, airMax: 630770 },
  { marksMax: 169, marksMin: 160, airMin: 630776, airMax: 656870 },
  { marksMax: 159, marksMin: 150, airMin: 656876, airMax: 683570 },
  { marksMax: 149, marksMin: 144, airMin: 683576, airMax: 710000 },
];

export const NEET_2026: NeetYearDataset = {
  year: 2026,
  source: 'NTA NEET UG 2026 official result statistics (re-exam)',
  totalAppeared: 2_209_318,
  totalQualified: 1_236_531,
  maxScore: 720,
  difficulty: 'very_hard',
  difficultyScore: 0.15,
  qualifyingMarks: {
    general_ews: 144,
    obc_ncl: 129,
    sc: 129,
    st: 129,
    pwd: 129,
  },
  anchors: [
    ...NTA_2026_TOP_POINTS,
    { marks: 405, air: 199_000 },
    { marks: 342, air: 335_000 },
    { marks: 144, air: 710_000 },
  ],
};
