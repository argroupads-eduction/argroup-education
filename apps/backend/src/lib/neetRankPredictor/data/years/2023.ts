import type { NeetYearDataset } from '../../types';

/** NTA NEET UG 2023 marks vs AIR (coaching/NTA trend compilation). */
export const NEET_2023: NeetYearDataset = {
  year: 2023,
  source: 'NTA NEET UG 2023 official trend data',
  totalAppeared: 2_035_313,
  totalQualified: 1_014_372,
  maxScore: 720,
  difficulty: 'moderate',
  difficultyScore: 0.55,
  qualifyingMarks: {
    general_ews: 137,
    obc_ncl: 107,
    sc: 107,
    st: 107,
    pwd: 107,
  },
  anchors: [
    { marks: 720, air: 1 },
    { marks: 715, air: 20 },
    { marks: 700, air: 500 },
    { marks: 690, air: 1200 },
    { marks: 675, air: 3500 },
    { marks: 650, air: 12000 },
    { marks: 645, air: 15000 },
    { marks: 625, air: 28000 },
    { marks: 610, air: 42000 },
    { marks: 600, air: 55000 },
    { marks: 580, air: 95000 },
    { marks: 550, air: 160000 },
    { marks: 500, air: 280000 },
    { marks: 450, air: 420000 },
    { marks: 400, air: 580000 },
    { marks: 350, air: 750000 },
    { marks: 300, air: 920000 },
    { marks: 200, air: 1300000 },
  ],
};
