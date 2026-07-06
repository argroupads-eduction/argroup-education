import { ABOUT_ESTABLISHED, ABOUT_STATS } from '@/lib/aboutContent';

export const RANK_POPUP_FEATURES = [
  {
    title: 'Expected AIR Prediction',
    text: 'AI-powered rank prediction',
    tone: 'green',
    icon: 'trophy',
  },
  {
    title: 'Government College Chances',
    text: 'State quota & AIQ analysis',
    tone: 'purple',
    icon: 'building',
  },
  {
    title: 'Detailed College List',
    text: 'Top MBBS colleges you can get',
    tone: 'blue',
    icon: 'chart',
  },
  {
    title: 'Counselling Guidance',
    text: 'Expert support for better decisions',
    tone: 'orange',
    icon: 'headset',
  },
  {
    title: 'MBBS in India & Abroad',
    text: 'Explore top global options',
    tone: 'pink',
    icon: 'globe',
  },
] as const;

export const RANK_POPUP_PANEL_STATS = [
  {
    value: '19+',
    label: 'Years of trust',
    icon: 'shield',
  },
  {
    value: '4000+',
    label: 'Students counselled',
    icon: 'users',
  },
  {
    value: '500+',
    label: 'University partners',
    icon: 'building',
  },
] as const;

export const RANK_POPUP_TRUST_LINE = `Trusted by ${ABOUT_STATS[0].value} NEET aspirants`;

export const RANK_POPUP_BRAND_LINE =
  `Guiding Thousands of Students to Their Dream MBBS College Since ${ABOUT_ESTABLISHED}`;
