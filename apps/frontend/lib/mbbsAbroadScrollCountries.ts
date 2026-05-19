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
    name: 'Georgia',
    slug: 'georgia',
    tagline: 'European experience · NMC-recognised options',
    description:
      'European campus life, English-medium MBBS programs, and universities shortlisted for Indian medical council norms.',
    gradient: 'from-[#4338ca] via-[#6366f1] to-[#312e81]',
    accent: '#a5b4fc',
  },
]
