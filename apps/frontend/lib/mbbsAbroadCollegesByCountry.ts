/** Shared MBBS Abroad country → college lists (navbar mega-menu). */

export type MbbsAbroadCollege = {
  name: string
}

export type MbbsAbroadUniversity = {
  id: string
  name: string
  href: string
  /** Omit for leaf universities (single link, no sub-colleges). */
  colleges?: MbbsAbroadCollege[]
}

export type MbbsAbroadCountryColleges = {
  id: string
  name: string
  navLabel: string
  href: string
  /** 2-level: country → colleges */
  colleges?: MbbsAbroadCollege[]
  /** 3-level: country → university → colleges (Nepal) */
  universities?: MbbsAbroadUniversity[]
}

function college(name: string): MbbsAbroadCollege {
  return { name }
}

function colleges(...names: string[]): MbbsAbroadCollege[] {
  return names.map(college)
}

function countryHref(countryId: string): string {
  return `/mbbs-abroad/${countryId}`
}

function universityHref(countryId: string, universityId: string): string {
  return `/mbbs-abroad/${countryId}/${universityId}`
}

export const MBBS_ABROAD_COUNTRIES: MbbsAbroadCountryColleges[] = [
  {
    id: 'russia',
    name: 'Russia',
    navLabel: 'Russia',
    href: countryHref('russia'),
    colleges: colleges(
      'North Caucasian State Academy, Russia',
      'Privolzhsky Research Medical University',
      'Yaroslav-the-wise Novgorod State Medical University',
      'Smolensk State Medical University',
      'Siberian State Medical University',
      'Kemerovo State Medical University',
      'Tula State Medical University',
      'Volgograd State Medical University',
      'Pskov State Medical University, Russia',
      'Crimea Federal Medical University',
      'Bashkir State Medical University',
      'Kazan Federal University',
      'Kazan State Medical University, Russia',
      'Saint Petersburg State Medical University Russia',
      'Orel State University, Russia',
      'Belgorod State University, Russia',
      'Altai State University, Russia',
      'Kursk State Medical University, Russia',
      'First Moscow State Medical University',
      'Kabardino Balkarian State University Russia',
      'OMSK State Medical University',
      'Peoples Friendship University Russia',
      'Pirogov Russian National Medical University',
      'Samara State Medical University',
      'Voronezh State Medical University Russia',
      'Chuvash State Medical University Russia'
    ),
  },
  {
    id: 'nepal',
    name: 'Nepal',
    navLabel: 'Nepal',
    href: countryHref('nepal'),
    universities: [
      {
        id: 'kathmandu-university',
        name: 'Kathmandu University Nepal',
        href: universityHref('nepal', 'kathmandu-university'),
        colleges: colleges(
          'College of Medical Science',
          'Manipal College of Medical Science',
          'Kathmandu University School of Medical Sciences',
          'Birat Medical College',
          'Kathmandu Medical College',
          'Nepal Medical College',
          'Nepalgunj Medical College',
          'Lumbini Medical College'
        ),
      },
      {
        id: 'tribhuvan-university',
        name: 'Tribhuvan University',
        href: universityHref('nepal', 'tribhuvan-university'),
        colleges: colleges(
          'Nepal Army Institute of Health Sciences',
          'KIST Medical College Kathmandu',
          'Chitwan Medical College',
          'Institute of Medicine',
          'Gandaki Medical College',
          'Universal Medical College'
        ),
      },
      {
        id: 'bp-koirala-institute',
        name: 'Autonomous College - B.P. Koirala Institute of Health Sciences',
        href: universityHref('nepal', 'bp-koirala-institute'),
      },
      {
        id: 'patan-academy',
        name: 'Autonomous College - Patan Academy of Health Science',
        href: universityHref('nepal', 'patan-academy'),
      },
    ],
  },
  {
    id: 'bangladesh',
    name: 'Bangladesh',
    navLabel: 'Bangladesh',
    href: countryHref('bangladesh'),
    colleges: colleges(
      'Dhaka National Medical College',
      'Medical College For Women and Hospital',
      'Bangladesh Medical College',
      'Holy Family Red Crescent Medical',
      'Tairunnessa Medical College',
      'International Medical College',
      'Uttara Adhunik Medical College',
      'TMSS Medical College',
      'North East Medical College & Hospital',
      'Popular Medical College Hospital',
      "Sylhet Women's Medical College and Hospital",
      'Central Medical College & Hospital',
      'Mainamoti Medical College',
      'Gonoshasthaya Samaj Vittik Medical College',
      'Jahurul Islam Medical College',
      'Anwer Khan Modern Medical',
      'Southern Medical College',
      "Ad-din Women's Medical College",
      'Delta Medical College & Hospital',
      'Green Life Medical College',
      'Enam Medical College',
      "Z H Sikder Women's Medical College",
      'Universal Medical College',
      'MH Samorita Medical College'
    ),
  },
  {
    id: 'uzbekistan',
    name: 'Uzbekistan',
    navLabel: 'Uzbekistan',
    href: countryHref('uzbekistan'),
    colleges: colleges(
      'Tashkent Pediatric Medical Institute',
      'Andijan State Medical Institute',
      'Bukhara State Medical Institute',
      'Tashkent State Medical Academy',
      'Samarkand State Medical University',
      'Urgench branch of Tashkent Medical Academy'
    ),
  },
  {
    id: 'kazakhstan',
    name: 'Kazakhstan',
    navLabel: 'Kazakhstan',
    href: countryHref('kazakhstan'),
    colleges: colleges(
      'Kazakh National Medical University',
      'Astana Medical University',
      'Al-Farabi Kazakh National University',
      'South Kazakhstan Medical Academy',
      'Karaganda State Medical University',
      'Semey State Medical University'
    ),
  },
  {
    id: 'serbia',
    name: 'Serbia',
    navLabel: 'Serbia',
    href: countryHref('serbia'),
    colleges: colleges('University of Kragujevac, Serbia'),
  },
  {
    id: 'iran',
    name: 'Iran',
    navLabel: 'Iran',
    href: countryHref('iran'),
    colleges: [],
  },
  {
    id: 'bosnia',
    name: 'Bosnia',
    navLabel: 'Bosnia',
    href: countryHref('bosnia'),
    colleges: colleges('University of East Sarajevo, Bosnia'),
  },
  {
    id: 'egypt',
    name: 'Egypt',
    navLabel: 'Egypt',
    href: countryHref('egypt'),
    colleges: [],
  },
  {
    id: 'vietnam',
    name: 'Vietnam',
    navLabel: 'Vietnam',
    href: countryHref('vietnam'),
    colleges: [],
  },
  {
    id: 'kyrgyzstan',
    name: 'Kyrgyzstan',
    navLabel: 'Kyrgyzstan',
    href: countryHref('kyrgyzstan'),
    colleges: colleges(
      'International School Of Medicine',
      'Jalal-Abad International University',
      'Osh International Medical University',
      'Asian Medical Institute',
      'Kyrgyz State Medical Academy',
      'Osh State Medical University',
      'Jalal-Abad State University'
    ),
  },
  {
    id: 'philippines',
    name: 'Philippines',
    navLabel: 'Philippines',
    href: countryHref('philippines'),
    colleges: colleges(
      'AMA Medical College',
      'Davao Medical School Foundation',
      'Bicol Christian College Of Medicine',
      'Our Lady of Fatima University',
      'University Of Perpetual Help System Dalta',
      'Lyceum North Western University',
      'Emilio Aguinaldo College'
    ),
  },
  {
    id: 'georgia',
    name: 'Georgia',
    navLabel: 'Georgia',
    href: countryHref('georgia'),
    colleges: colleges(
      'Batumi Shota Rustaveli State University',
      'East European University',
      'New Vision University',
      'Petre Shotadze Tbilisi Medical Academy'
    ),
  },
  {
    id: 'china',
    name: 'China',
    navLabel: 'China',
    href: countryHref('china'),
    colleges: colleges(
      'Tianjin Medical University',
      'Jilin Medical University',
      'Fudan University',
      'Qingdao University',
      'Fujian Medical University',
      'Jiangsu University',
      'Nanjing Medical University',
      'China Medical University',
      'China Three Gorges Medical University',
      'Anhui Medical University',
      'Beihua University',
      'Dalian Medical University',
      'Soochow Medical University'
    ),
  },
  {
    id: 'romania',
    name: 'Romania',
    navLabel: 'Romania',
    href: countryHref('romania'),
    colleges: [],
  },
  {
    id: 'asia',
    name: 'Asia',
    navLabel: 'Asia',
    href: countryHref('asia'),
    colleges: colleges('Universidade Católica Timorense'),
  },
]

export function isMbbsAbroadThreeLevel(country: MbbsAbroadCountryColleges): boolean {
  return Boolean(country.universities?.length)
}

export function getMbbsAbroadCountryById(id: string): MbbsAbroadCountryColleges | undefined {
  return MBBS_ABROAD_COUNTRIES.find((c) => c.id === id)
}

export function mbbsAbroadCountryHref(countryId: string): string {
  return countryHref(countryId)
}

export function mbbsAbroadCollegeHref(countryId: string): string {
  return countryHref(countryId)
}

export function mbbsAbroadUniversityHref(countryId: string, universityId: string): string {
  return universityHref(countryId, universityId)
}

/** Total colleges shown in the right column for a country (2-level or all Nepal groups). */
export function mbbsAbroadCountryCollegeCount(country: MbbsAbroadCountryColleges): number {
  if (country.colleges) return country.colleges.length
  if (!country.universities) return 0
  return country.universities.reduce((sum, u) => sum + (u.colleges?.length ?? 0), 0)
}
