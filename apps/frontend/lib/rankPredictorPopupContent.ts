import { ABOUT_ESTABLISHED, ABOUT_STATS } from '@/lib/aboutContent';
import { NEET_PREDICTOR_SUBTITLE } from '@/lib/neetRankPredictor/data';

export const RANK_POPUP_SIDEBAR_TAGLINE = 'PREDICT RANK · MAP COLLEGES · PLAN MBBS';

export const RANK_POPUP_SIDEBAR_SUBTITLE = NEET_PREDICTOR_SUBTITLE;

export const RANK_POPUP_FORM_FOOTER =
  'Powered by AR Group of Education — trusted NEET rank guidance for MBBS counselling · 100% free tool.';

export const RANK_POPUP_TRACK_OPTIONS = [
  { id: 'india' as const, label: 'MBBS India' },
  { id: 'abroad' as const, label: 'MBBS Abroad' },
  { id: 'md-ms' as const, label: 'MD/MS' },
  { id: 'bams' as const, label: 'BAMS' },
];

export const RANK_POPUP_FORM_TRUST_ITEMS = [
  { icon: 'shield' as const, value: '19+', label: 'Years of trust' },
  { icon: 'users' as const, value: '4000+', label: 'Students guided' },
  { icon: 'check' as const, value: '100%', label: 'Free · No spam' },
];

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
