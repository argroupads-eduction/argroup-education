import { MBBS_ABROAD_COUNTRIES } from '@/lib/mbbsAbroadCollegesByCountry';
import { MBBS_INDIA_STATES } from '@/lib/mbbsIndiaCollegesByState';
import { MD_MS_NAV_ITEMS } from '@/lib/mdMsNav';
import { LATEST_UPDATES_NAV } from '@/lib/latestUpdatesNav';

// Site Constants
export const SITE_NAME = 'AR Group of Education';
export const SITE_DESCRIPTION =
  'AR Group of Education is your trusted partner for MBBS India & MBBS Abroad admissions, NEET counselling and end-to-end visa support.';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://argroupofeducation.com';
import { getApiBaseUrl } from '@/lib/apiBase';

export const API_URL = getApiBaseUrl();

// Brand Colors
export const COLORS = {
  navy: '#1a365d',
  gold: '#ff9800',
  sky: '#0ea5e9',
  white: '#ffffff',
  lightGray: '#f3f4f6',
  darkGray: '#6b7280',
} as const;

// Navigation Links
export const NAV_LINKS = [
  { 
    label: 'Home', 
    href: '/'
  },
  { 
    label: 'About', 
    href: '/about'
  },
  { 
    label: 'MBBS India', 
    href: '/mbbs-india',
    megaMenu: 'mbbs-india' as const,
    submenu: MBBS_INDIA_STATES.map((state) => ({
      label: state.navLabel,
      stateName: state.name,
      href: state.href,
      colleges: state.colleges.map((c) => ({ label: c.name, href: c.href })),
    })),
  },
  {
    label: 'MBBS Abroad',
    href: '/mbbs-abroad',
    megaMenu: 'mbbs-abroad' as const,
    submenu: MBBS_ABROAD_COUNTRIES.map((country) => ({
      label: country.navLabel,
      countryName: country.name,
      href: country.href,
      colleges: country.colleges?.map((c) => ({
        label: c.name,
        href: c.href,
      })),
      universities: country.universities?.map((u) => ({
        label: u.name,
        href: u.href,
        colleges: u.colleges?.map((c) => ({
          label: c.name,
          href: c.href,
        })),
      })),
    })),
  },
  {
    label: 'MD/MS',
    href: '/md-ms',
    megaMenu: 'md-ms' as const,
    submenu: MD_MS_NAV_ITEMS.map((item) => ({
      label: item.label,
      href: item.href,
    })),
  },
  {
    ...LATEST_UPDATES_NAV,
  },
  {
    label: 'Contact',
    href: '/contact',
  },
] as const;

/** Shown in navbar CTA row (right of Expert Counselling), not in main nav links */
export const NEET_RANK_PREDICTOR_LINK = {
  label: 'NEET Rank',
  href: '/neet-rank-predictor',
} as const;

// Countries Data
export const FEATURED_COUNTRIES = [
  {
    name: 'Russia',
    slug: 'russia',
    description: 'World-class medical education with high fees affordable',
    benefits: ['WHO approved', '6 years duration', 'Low fees'],
  },
  {
    name: 'Georgia',
    slug: 'georgia',
    description: 'Modern curriculum in Eastern Europe',
    benefits: ['English medium', 'Affordable fees', 'European standard'],
  },
  {
    name: 'Kazakhstan',
    slug: 'kazakhstan',
    description: 'Prestigious universities with excellent placement',
    benefits: ['Quality education', 'Low fees', 'Good placement'],
  },
  {
    name: 'Kyrgyzstan',
    slug: 'kyrgyzstan',
    description: 'Budget-friendly option in Central Asia',
    benefits: ['Most affordable', 'Good universities', 'Easy admission'],
  },
  {
    name: 'Bangladesh',
    slug: 'bangladesh',
    description: 'Education close to home with quality standards',
    benefits: ['Same region', 'Quality education', 'Known universities'],
  },
  {
    name: 'Nepal',
    slug: 'nepal',
    description: 'Neighboring country with excellent medical colleges',
    benefits: ['Nearby location', 'Quality education', 'Lower fees'],
  },
  {
    name: 'Uzbekistan',
    slug: 'uzbekistan',
    description: 'Emerging medical hub in Central Asia',
    benefits: ['Modern infrastructure', 'Quality teaching', 'Affordable'],
  },
  {
    name: 'Egypt',
    slug: 'egypt',
    description: 'Ancient medical tradition with modern standards',
    benefits: ['International recognition', 'Good placement', 'Affordable'],
  },
  {
    name: 'China',
    slug: 'china',
    description: 'Advanced medical science education',
    benefits: ['Top universities', 'Advanced research', 'Global recognition'],
  },
] as const;

// Services
export const SERVICES = [
  {
    id: 'mbbs-abroad',
    title: 'MBBS Abroad',
    description: 'Expert guidance for studying MBBS in international universities',
    icon: 'Globe',
  },
  {
    id: 'mbbs-india',
    title: 'MBBS in India',
    description: 'Complete guidance for medical education in India',
    icon: 'MapPin',
  },
  {
    id: 'admission',
    title: 'Admission Guidance',
    description: 'Professional assistance with university applications',
    icon: 'FileText',
  },
  {
    id: 'visa',
    title: 'Visa Assistance',
    description: 'Complete visa processing support',
    icon: 'Passport',
  },
  {
    id: 'counselling',
    title: 'Career Counselling',
    description: 'Expert career guidance and planning',
    icon: 'Users',
  },
  {
    id: 'scholarship',
    title: 'Scholarship Assistance',
    description: 'Help securing scholarships and financial aid',
    icon: 'Award',
  },
  {
    id: 'documentation',
    title: 'Documentation Support',
    description: 'Document preparation and verification',
    icon: 'CheckCircle',
  },
  {
    id: 'predeparture',
    title: 'Pre-Departure Support',
    description: 'Essential guidance before your journey',
    icon: 'Plane',
  },
] as const;

// Statistics
export const STATISTICS = [
  { label: 'Students Guided', value: '4000+', icon: 'Users' },
  { label: 'Years of Experience', value: '19+', icon: 'Award' },
  { label: 'Universities Partnered', value: '500+', icon: 'Building2' },
  { label: 'Visa Success Rate', value: '98%', icon: 'TrendingUp' },
] as const;

// FAQ Data
export const FAQ_DATA = [
  {
    question: 'What is the eligibility for MBBS abroad?',
    answer:
      'You need to have passed 12th with Physics, Chemistry, and Biology. NEET scores are typically required for most countries. Specific requirements vary by country and university.',
  },
  {
    question: 'What is the total cost of MBBS abroad?',
    answer:
      'Total cost varies by country. Russia: 25-35 lakhs, Georgia: 20-30 lakhs, Kazakhstan: 15-25 lakhs. This includes tuition, accommodation, and living expenses.',
  },
  {
    question: 'How long is the MBBS course?',
    answer:
      'Most international MBBS programs are 6 years, including 1 year internship. Some universities offer 5.5 years programs.',
  },
  {
    question: 'Is NEET required for MBBS abroad?',
    answer:
      'NEET is required for most countries. Some universities may accept alternative qualifications. We guide you through country-specific requirements.',
  },
  {
    question: 'What about placement after completing MBBS?',
    answer:
      'Graduates can practice in India after obtaining NMC certification. Many also practice in their university country or other nations depending on licensing requirements.',
  },
  {
    question: 'How do I get a student visa?',
    answer:
      'We handle complete visa processing including document preparation, application submission, and visa interview coaching. Our success rate is 98%.',
  },
] as const;

// Social Links (footer + topbar)
export const SOCIAL_LINKS = [
  { platform: 'facebook', url: 'https://www.facebook.com/argroupeducation' },
  { platform: 'instagram', url: 'https://www.instagram.com/argroupofeducation1/' },
  { platform: 'youtube', url: 'https://www.youtube.com/@argroupofeducation' },
  { platform: 'whatsapp', url: 'https://wa.me/919667006402' },
] as const;

export const FOOTER_SOCIAL_PLATFORMS = ['facebook', 'instagram', 'youtube'] as const;

// Contact Info
export const CONTACT_INFO = {
  phone: '+91-7076909090',
  phoneTel: '+917076909090',
  email: 'info@argroupofeducation.com',
  whatsapp: 'https://wa.me/919667006402',
  address: 'Sector 18, Noida · Wave Silver Tower, Office 523',
  addressLines: [
    'Sector 18, Noida',
    'Wave Silver Tower',
    'Office No. 523',
  ] as const,
  hours: '24×7, open all week',
  hoursShort: '24×7',
  city: 'Noida',
} as const;

// SEO Keywords
export const SEO_KEYWORDS = {
  global: ['MBBS abroad', 'medical education', 'consultancy', 'university admission'],
  home: ['MBBS', 'study abroad', 'medical college', 'education consultancy'],
  blog: ['medical education', 'MBBS tips', 'study abroad guide'],
} as const;

// Cache Durations (in seconds)
export const CACHE_DURATIONS = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  VERY_LONG: 86400,
} as const;
