import type { NeetYearDataset } from '../../types';

/** NTA NEET UG 2022 marks vs AIR trend data. */
export const NEET_2022: NeetYearDataset = {
  year: 2022,
  source: 'NTA NEET UG 2022 official trend data',
  totalAppeared: 1_872_343,
  totalQualified: 993_069,
  maxScore: 715,
  difficulty: 'moderate',
  difficultyScore: 0.5,
  qualifyingMarks: {
    general_ews: 117,
    obc_ncl: 93,
    sc: 93,
    st: 93,
    pwd: 93,
  },
  anchors: [
    { marks: 715, air: 1 },
    { marks: 700, air: 800 },
    { marks: 690, air: 2000 },
    { marks: 675, air: 5000 },
    { marks: 650, air: 14000 },
    { marks: 645, air: 17000 },
    { marks: 625, air: 32000 },
    { marks: 610, air: 48000 },
    { marks: 600, air: 62000 },
    { marks: 580, air: 105000 },
    { marks: 550, air: 175000 },
    { marks: 500, air: 300000 },
    { marks: 450, air: 450000 },
    { marks: 400, air: 620000 },
    { marks: 350, air: 800000 },
    { marks: 300, air: 980000 },
    { marks: 200, air: 1400000 },
  ],
};
