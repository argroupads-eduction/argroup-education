export const SERVICES_HERO_LEAD =
  'From your first NEET counselling call to campus arrival abroad, AR Group offers medical-only admission services built on transparency, verified universities, and counsellors who stay with you end-to-end.';

export const SERVICES_STATS = [
  { value: '4,000+', label: 'Students guided' },
  { value: '500+', label: 'Partner universities' },
  { value: '15+', label: 'Countries covered' },
  { value: '98%', label: 'Visa success rate' },
] as const;

export const SERVICES_FLAGSHIP = [
  {
    id: 'mbbs-india',
    title: 'MBBS in India',
    tagline: 'NEET counselling & state-wise admissions',
    description:
      'State quota strategy, private and deemed college shortlists, fee counselling, and documentation for MBBS admissions across India.',
    bullets: ['NEET UG counselling support', 'State-wise college matching', 'Admission & seat booking help'],
    href: '/mbbs-india',
    accent: 'india',
    featured: true,
  },
  {
    id: 'mbbs-abroad',
    title: 'MBBS Abroad',
    tagline: 'WHO-listed · NMC-aligned universities',
    description:
      'Compare Russia, Georgia, Kazakhstan, Bangladesh and more with honest fee breakdowns, eligibility checks, and vetted university partners.',
    bullets: ['Country & university comparison', 'English-medium program guidance', 'Transparent total cost planning'],
    href: '/mbbs-abroad',
    accent: 'abroad',
    featured: true,
  },
  {
    id: 'md-ms',
    title: 'MD / MS & PG Medical',
    tagline: 'Postgraduate pathway counselling',
    description:
      'Specialisation planning, state PG counselling strategy, seat selection, and admission coordination for postgraduate medical courses.',
    bullets: ['MD/MS shortlisting by rank', 'State counselling strategy', 'Documentation & admission support'],
    href: '/md-ms',
    accent: 'pg',
    featured: true,
  },
  {
    id: 'neet-predictor',
    title: 'NEET Rank Predictor',
    tagline: 'Data-backed college insights',
    description:
      'Estimate your NEET rank, explore likely colleges, and book a counsellor session to turn predictions into a practical admission plan.',
    bullets: ['Score-to-rank estimation', 'College match suggestions', 'Free expert follow-up counselling'],
    href: '/neet-rank-predictor',
    accent: 'neet',
    featured: false,
  },
] as const;

export const SERVICES_SUPPORT = [
  {
    id: 'counselling',
    title: 'Expert Counselling',
    description:
      'One-on-one sessions around your NEET rank, budget, and career goals, no commission-driven college lists.',
  },
  {
    id: 'shortlisting',
    title: 'University Shortlisting',
    description:
      'Data-backed college lists with fee brackets, seat history, licensing alignment, and fit scores for your profile.',
  },
  {
    id: 'admission',
    title: 'Admission & Applications',
    description:
      'Application filing, offer letters, university coordination, and step-by-step guidance through each admission milestone.',
  },
  {
    id: 'documentation',
    title: 'Documentation Support',
    description:
      'Checklists, notarisation guidance, academic records, and error-free document packs for universities and embassies.',
  },
  {
    id: 'visa',
    title: 'Visa Assistance',
    description:
      'Visa documentation, application filing, interview prep, and embassy process support with a 98% success track record.',
  },
  {
    id: 'scholarship',
    title: 'Scholarship & Fee Counselling',
    description:
      'Upfront tuition, hostel, insurance, and forex breakdowns plus scholarship opportunities where available.',
  },
  {
    id: 'bams',
    title: 'BAMS & Allied Medical',
    description:
      'Guidance for BAMS and allied medical pathways with eligibility review and college shortlisting in India.',
  },
  {
    id: 'predeparture',
    title: 'Pre-Departure & Airport Support',
    description:
      'Forex, tickets, packing checklists, hostel onboarding, and airport coordination for students and parents.',
  },
] as const;

export const SERVICES_PROCESS = [
  {
    step: '01',
    title: 'Discover',
    text: 'Share your NEET rank, budget, and preferences in a confidential counselling call.',
  },
  {
    step: '02',
    title: 'Shortlist',
    text: 'Compare India vs abroad options with transparent fees, eligibility, and licensing fit.',
  },
  {
    step: '03',
    title: 'Apply',
    text: 'We coordinate applications, documents, and university communication with you.',
  },
  {
    step: '04',
    title: 'Visa & travel',
    text: 'Visa filing, forex, tickets, and a pre-departure checklist for a smooth move.',
  },
  {
    step: '05',
    title: 'Fly & thrive',
    text: 'Airport support, hostel onboarding, and alumni connects at your destination.',
  },
] as const;

export const SERVICES_PROMISES = [
  {
    id: 'transparent',
    title: 'Zero hidden fees',
    text: 'Every tuition, hostel, and forex cost shared upfront before you apply.',
  },
  {
    id: 'verified',
    title: 'Verified universities',
    text: 'NMC/WHO-aligned institutions with documented admission track records.',
  },
  {
    id: 'personal',
    title: 'One counsellor',
    text: 'The same advisor from first call to airport departure, no hand-offs.',
  },
  {
    id: 'parents',
    title: 'Parents in the loop',
    text: 'WhatsApp updates, checklists, and call-backs so families stay informed.',
  },
] as const;

export const SERVICES_SEO = {
  title: 'Admission Counseling Services | Career Guidance Services',
  description:
    'Explore our expert admission counseling services and career guidance services. Get professional advice on top college selection, admissions, and course mapping.',
  keywords: ['Admission Counseling Services', 'Career Guidance Services'] as const,
} as const;
