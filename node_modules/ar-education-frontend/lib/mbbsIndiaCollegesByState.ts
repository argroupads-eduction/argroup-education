/** Shared MBBS India state → college lists (navbar mega-menu + home carousel). */

export type MbbsIndiaCollege = {
  name: string
  city?: string
}

export type MbbsIndiaStateColleges = {
  id: string
  name: string
  navLabel: string
  href: string
  colleges: MbbsIndiaCollege[]
}

function c(full: string): MbbsIndiaCollege {
  const idx = full.lastIndexOf(',')
  if (idx > 0 && idx < full.length - 2) {
    return { name: full.slice(0, idx).trim(), city: full.slice(idx + 1).trim() }
  }
  return { name: full.trim() }
}

function colleges(...items: string[]): MbbsIndiaCollege[] {
  return items.map(c)
}

export const MBBS_INDIA_STATES: MbbsIndiaStateColleges[] = [
  {
    id: 'up',
    name: 'Uttar Pradesh',
    navLabel: 'UP',
    href: '/mbbs-india/up',
    colleges: colleges(
      'Rama Medical College, Kanpur',
      'Saraswathi Institute of Medical Sciences, Hapur',
      'NCR Institute Of Medical Sciences, Meerut',
      'Venkateshwara Institute of Medical Sciences, Gajraula',
      'Shri Gorakhnath Medical College',
      'Muzaffarnagar Medical College - [MMC], Muzaffarnagar',
      'FH Medical College, Agra',
      'Subharti Medical College',
      'K.D. Medical College - Hospital and Research Center, Mathura',
      'Naraina Medical College & Research Center - [NMRC], Kanpur',
      'Ajay Sangal Institute Of Medical Sciences',
      'Dr SS Kushwah Institute of Medical Sciences',
      'Prasad Institute of Medical Sciences, Lucknow',
      'KMC Medical College',
      'Shri Siddhi Vinayak Medical College and Hospital',
      'Rajshree Medical Research Institute, Bareilly',
      'Career Institute of Medical Sciences, Lucknow',
      'United Institute of Medical Sciences, Prayagraj',
      'Heritage Institute of Medical Sciences',
      'Hind Institute of Medical Sciences, Sitapur',
      'Integral Institute Of Medical Sciences, Lucknow',
      'Rama Medical College, Hapur',
      'Santosh Medical College, Ghaziabad',
      'Sharda University',
      'Shri Ram Murti Smarak Institute Of Medical Sciences, Bareilly',
      'Rohilkhand Medical College, Bareilly',
      'Noida International Institute of Medical Sciences, Greater Noida',
      'TS Misra Medical College & Hospital, Lucknow',
      'Krishna Mohan Medical College, Mathura',
      'SKS Hospital Medical College, Mathura',
      'Teerthanker Mahaveer Medical College, Moradabad',
      'GS Medical College, Hapur',
      'Kalka Dental College & Hospital',
      'Mayo Institute of Medical Sciences'
    ),
  },
  {
    id: 'haryana',
    name: 'Haryana',
    navLabel: 'Haryana',
    href: '/mbbs-india/haryana',
    colleges: colleges(
      'RPS College of Veterinary & Animal Sciences, LUVAS',
      'Al-falah School of Medical Sciences & Research Centre',
      'Manav Rachna Dental College',
      'Maharishi Markandeshwar Medical College, Ambala',
      'Adesh Medical College',
      'NC Medical College and Hospital, Panipat',
      'SGT Medical College, Gurugram',
      'World College of Medical Science and Research, Jhajjar',
      'Amrita Medical College, Faridabad'
    ),
  },
  {
    id: 'rajasthan',
    name: 'Rajasthan',
    navLabel: 'Rajasthan',
    href: '/mbbs-india/rajasthan',
    colleges: colleges(
      'Sudha Medical College',
      'Vyas Medical College',
      'Ananta Institute of Medical Sciences & Research Centre, Rajsamand',
      'Mahatma Gandhi University of Medical Science & Technology, Jaipur',
      'American International Institute of Medical Science, Udaipur',
      'Surendera Dental College',
      'Pacific Medical College',
      'Pacific Institute of Medical Science - [PIMS], Udaipur',
      'National Institute of Medical Sciences & Research, Jaipur',
      'Jaipur National University, Rajasthan',
      'Dr SS Tantia Medical College, Sri Ganganagar',
      'Geetanjali Medical College, Rajasthan'
    ),
  },
  {
    id: 'maharashtra',
    name: 'Maharashtra',
    navLabel: 'Maharashtra',
    href: '/mbbs-india/maharashtra',
    colleges: colleges(
      'DY Patil Medical College, Pune',
      'Symbiosis Medical College for Women, Pune',
      'Bharati Vidyapeeth Medical College, Pune',
      'MGM Medical College',
      'Datta Meghe Medical College, Nagpur'
    ),
  },
  {
    id: 'karnataka',
    name: 'Karnataka',
    navLabel: 'Karnataka',
    href: '/mbbs-india/karnataka',
    colleges: colleges(
      'BRAMC Dr BR Ambedkar Medical College',
      'JSS Medical College',
      'JJM Medical College',
      'Jawaharlal Nehru Medical College',
      'Kasturba Medical College',
      'Al-Ameen Medical College',
      "St. John's Medical College",
      'S Nijalingappa Medical College and H.S.K Hospital',
      'Adichunchanagiri Institute of Medical Sciences',
      'AJ Institute of Medical Sciences and Research Centre',
      'Vydehi Institute of Medical Sciences and Research Centre',
      'MVJ Medical College & Research Hospital',
      'MS Ramaiah Medical College, Bangalore',
      'Kempegowda Institute of Medical Sciences'
    ),
  },
  {
    id: 'mp',
    name: 'Madhya Pradesh',
    navLabel: 'MP',
    href: '/mbbs-india/mp',
    colleges: colleges(
      'LNCT Medical College, Indore',
      'Sukh Sagar Medical College and Hospital',
      'Sri Satya Sai University of Technology & Medical Sciences',
      'RKDF Medical College & Research Centre, Bhopal',
      'Ram Krishna Medical College Hospital and Research Centre',
      'Amaltas Institute of Medical Science, Dewas',
      'Index Medical College, Indore',
      'Sri Aurobindo Institute of Medical Sciences, Indore',
      'Ruxmaniben Deepchand Gardi Medical College, Ujjain',
      'Peoples College of Medical Science, Bhopal',
      'LN Medical College, Bhopal',
      'Chirayu Medical College and Hospital, Bhopal'
    ),
  },
  {
    id: 'bihar',
    name: 'Bihar',
    navLabel: 'Bihar',
    href: '/mbbs-india/bihar',
    colleges: colleges(
      'Lord Buddha Koshi Medical College & Hospital',
      'Mata Gujri Memorial Medical College',
      'Radha Devi Jageshwari Memorial Medical College, Muzaffarpur',
      'Shree Narayan Medical Institute & Hospital, Saharsa',
      'Narayan Medical College & Hospital, Bihar',
      'Madhubani Medical College & Hospital, Bihar',
      'Katihar Medical College, Bihar',
      'Netaji Subhas Medical College & Hospital'
    ),
  },
  {
    id: 'uttarakhand',
    name: 'Uttarakhand',
    navLabel: 'Uttarakhand',
    href: '/mbbs-india/uttarakhand',
    colleges: colleges(
      'Graphic Era Institute of Medical Sciences',
      'Gautam Buddha Chikitsa Mahavidyalaya, Dehradun',
      'Himalayan Institute of Medical Science, Dehradun',
      'Shri Guru Ram Rai Institute of Medical Science'
    ),
  },
  {
    id: 'himachal-pradesh',
    name: 'Himachal Pradesh',
    navLabel: 'Himachal Pradesh',
    href: '/mbbs-india/himachal-pradesh',
    colleges: colleges('Maharishi Markandeshwar Medical College, Solan'),
  },
  {
    id: 'delhi',
    name: 'Delhi',
    navLabel: 'Delhi',
    href: '/mbbs-india/delhi',
    colleges: colleges(
      'Hamdard Institute of Medical Sciences & Research (HIMSR), New Delhi'
    ),
  },
  {
    id: 'chhattisgarh',
    name: 'Chhattisgarh',
    navLabel: 'Chhattisgarh',
    href: '/mbbs-india/chhattisgarh',
    colleges: colleges(
      'Raipur Institute of Medical Sciences',
      'Shri Rawatpura Sarkar Institute of Medical Sciences and Research',
      'Shri Balaji Institute of Medical Sciences, Raipur',
      'Shree Shankaracharya Institute of Medical Sciences'
    ),
  },
  {
    id: 'jharkhand',
    name: 'Jharkhand',
    navLabel: 'Jharkhand',
    href: '/mbbs-india/jharkhand',
    colleges: colleges('Manipal TATA Medical College (MTMC), Jamshedpur'),
  },
  {
    id: 'sikkim',
    name: 'Sikkim',
    navLabel: 'Sikkim',
    href: '/mbbs-india/sikkim',
    colleges: colleges('Sikkim Manipal University'),
  },
  {
    id: 'pondicherry',
    name: 'Pondicherry',
    navLabel: 'Pondicherry',
    href: '/mbbs-india/pondicherry',
    colleges: colleges(
      'Aarupadai Veedu Medical College & Hospital',
      'Shri Lakshmi Narayan Institute of Medical Sciences',
      'Mahatma Gandhi Medical College & Research Institute'
    ),
  },
  {
    id: 'kerala',
    name: 'Kerala',
    navLabel: 'Kerala',
    href: '/mbbs-india/kerala',
    colleges: colleges(
      'Amrita School of Medicine, Kochi',
      'Jubilee Mission Medical College, Thrissur',
      'Pushpagiri Institute of Medical Sciences, Thiruvalla'
    ),
  },
  {
    id: 'west-bengal',
    name: 'West Bengal',
    navLabel: 'West Bengal',
    href: '/mbbs-india/west-bengal',
    colleges: colleges(
      'ICARE Institute of Medical Sciences',
      'Santiniketan Medical College',
      'Gouri Devi Institute of Medical Sciences and Hospital',
      'JIS School of Medical Science & Research',
      'IQ City Medical College',
      'Shri Ramkrishna Institute of Medical Sciences',
      'Jagannath Gupta Institute of Medical Sciences',
      'KPC Medical College'
    ),
  },
  {
    id: 'tamil-nadu',
    name: 'Tamil Nadu',
    navLabel: 'Tamil Nadu',
    href: '/mbbs-india/tamil-nadu',
    colleges: colleges(
      'Madras Medical College, Chennai',
      'Christian Medical College, Vellore',
      'Stanley Medical College, Chennai',
      'Sri Ramachandra Medical College, Chennai',
      'Chettinad Hospital and Research Institute, Chennai'
    ),
  },
]

export function getMbbsIndiaStateById(id: string): MbbsIndiaStateColleges | undefined {
  return MBBS_INDIA_STATES.find((s) => s.id === id)
}

/** Home section deep-link: `/home#up` */
export function mbbsIndiaStateHomeHash(stateId: string): string {
  return `/home#${stateId}`
}
