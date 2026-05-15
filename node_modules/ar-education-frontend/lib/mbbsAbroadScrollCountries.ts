/** MBBS Abroad — scroll-reveal country panels (home section). */

export type MbbsAbroadScrollCountry = {
  name: string
  slug: string
  tagline: string
  /** Longer copy for the pinned left column */
  description: string
  /** Tailwind gradient stops for the right visual card */
  gradient: string
  accent: string
  /** Optional future hero image path under /public */
  imageSrc?: string
}

export const MBBS_ABROAD_SCROLL_COUNTRIES: MbbsAbroadScrollCountry[] = [
  {
    name: 'Russia',
    slug: 'russia',
    tagline: 'WHO-listed universities · English & bilingual programs',
    description:
      'Study at established Russian medical universities with affordable tuition, modern labs, and pathways recognised for FMGE/NExT preparation.',
    gradient: 'from-[#1e3a5f] via-[#2563eb] to-[#0f172a]',
    accent: '#60a5fa',
  },
  {
    name: 'Nepal',
    slug: 'nepal',
    tagline: 'Close to India · Recognised medical degrees',
    description:
      'A culturally familiar destination with shorter travel time, strong clinical exposure, and degrees aligned with Indian medical council requirements.',
    gradient: 'from-[#7f1d1d] via-[#dc2626] to-[#450a0a]',
    accent: '#fca5a5',
  },
  {
    name: 'Bangladesh',
    slug: 'bangladesh',
    tagline: 'Affordable fees · Strong clinical exposure',
    description:
      'Competitive fee structures, English-medium instruction, and hospital attachments that prepare students for licensing exams back home.',
    gradient: 'from-[#1e3a5f] via-[#1e40af] to-[#0f172a]',
    accent: '#93c5fd',
  },
  {
    name: 'Uzbekistan',
    slug: 'uzbekistan',
    tagline: 'Modern campuses · Growing medical hub',
    description:
      'New-generation campuses, structured MBBS curricula, and a Central Asian hub attracting international students every year.',
    gradient: 'from-[#0f243a] via-[#1a365d] to-[#051219]',
    accent: '#668bc2',
  },
  {
    name: 'Kazakhstan',
    slug: 'kazakhstan',
    tagline: 'Quality education · Central Asia gateway',
    description:
      'Recognised programs, safe student cities, and transparent admission support for NEET-qualified Indian applicants.',
    gradient: 'from-[#1e40af] via-[#3b82f6] to-[#172554]',
    accent: '#93c5fd',
  },
  {
    name: 'Serbia',
    slug: 'serbia',
    tagline: 'European standard · English-medium MBBS',
    description:
      'European-standard medical training, English-taught degrees, and an EU-adjacent lifestyle at comparatively lower living costs.',
    gradient: 'from-[#4c1d95] via-[#7c3aed] to-[#2e1065]',
    accent: '#c4b5fd',
  },
  {
    name: 'Iran',
    slug: 'iran',
    tagline: 'Established medical universities · Structured curriculum',
    description:
      'Long-standing medical faculties, rigorous academics, and structured clinical rotations guided by experienced faculty.',
    gradient: 'from-[#1e3a8a] via-[#312e81] to-[#0f172a]',
    accent: '#a5b4fc',
  },
  {
    name: 'Bosnia',
    slug: 'bosnia',
    tagline: 'EU-adjacent education · Affordable living',
    description:
      'European-quality education in the Balkans with manageable living expenses and growing recognition among Indian students.',
    gradient: 'from-[#b45309] via-[#f59e0b] to-[#78350f]',
    accent: '#fde68a',
  },
  {
    name: 'Egypt',
    slug: 'egypt',
    tagline: 'Historic medical schools · International intake',
    description:
      'Centuries-old medical traditions, diverse clinical settings, and established intake processes for international MBBS aspirants.',
    gradient: 'from-[#a16207] via-[#eab308] to-[#713f12]',
    accent: '#fef08a',
  },
  {
    name: 'Vietnam',
    slug: 'vietnam',
    tagline: 'Rising destination · Competitive tuition',
    description:
      'Fast-growing healthcare infrastructure, competitive fees, and English-friendly campuses in Southeast Asia.',
    gradient: 'from-[#be123c] via-[#f43f5e] to-[#881337]',
    accent: '#fda4af',
  },
  {
    name: 'Kyrgyzstan',
    slug: 'kyrgyzstan',
    tagline: 'Budget-friendly · Easy admission process',
    description:
      'Among the most budget-friendly MBBS abroad options with straightforward documentation and visa counselling support.',
    gradient: 'from-[#0f243a] via-[#1e40af] to-[#172554]',
    accent: '#93c5fd',
  },
  {
    name: 'Philippines',
    slug: 'philippines',
    tagline: 'US-style curriculum · English speaking',
    description:
      'US-influenced pre-med and MD pathways, full English immersion, and strong ties to Western licensing frameworks.',
    gradient: 'from-[#c2410c] via-[#fb923c] to-[#7c2d12]',
    accent: '#fdba74',
  },
  {
    name: 'Georgia',
    slug: 'georgia',
    tagline: 'European experience · NMC-recognised options',
    description:
      'European campus life, English-medium MBBS programs, and universities shortlisted for Indian medical council norms.',
    gradient: 'from-[#4338ca] via-[#6366f1] to-[#312e81]',
    accent: '#a5b4fc',
  },
  {
    name: 'China',
    slug: 'china',
    tagline: 'Advanced infrastructure · Global recognition',
    description:
      'State-of-the-art hospitals and labs, A-list university options, and globally recognised degrees when chosen carefully.',
    gradient: 'from-[#991b1b] via-[#ef4444] to-[#450a0a]',
    accent: '#fecaca',
  },
  {
    name: 'Romania',
    slug: 'romania',
    tagline: 'EU pathway · Quality medical programs',
    description:
      'EU-member medical education, quality teaching hospitals, and long-term career mobility across Europe for graduates.',
    gradient: 'from-[#1d4ed8] via-[#facc15] to-[#1e3a8a]',
    accent: '#fef9c3',
  },
]
