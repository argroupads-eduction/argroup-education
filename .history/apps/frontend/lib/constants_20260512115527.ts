// Site Constants
export const SITE_NAME = 'AR Group of Education';
export const SITE_DESCRIPTION = 'Premium educational consultancy platform for medical education abroad';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://argroup.edu';
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
    submenu: [
      { label: 'UP', href: '/mbbs-india/up' },
      { label: 'Haryana', href: '/mbbs-india/haryana' },
      { label: 'Rajasthan', href: '/mbbs-india/rajasthan' },
      { label: 'Maharashtra', href: '/mbbs-india/maharashtra' },
      { label: 'Karnataka', href: '/mbbs-india/karnataka' },
      { label: 'MP', href: '/mbbs-india/mp' },
      { label: 'Bihar', href: '/mbbs-india/bihar' },
      { label: 'Uttarakhand', href: '/mbbs-india/uttarakhand' },
      { label: 'Himachal Pradesh', href: '/mbbs-india/himachal-pradesh' },
      { label: 'Delhi', href: '/mbbs-india/delhi' },
      { label: 'Chhattisgarh', href: '/mbbs-india/chhattisgarh' },
      { label: 'Jharkhand', href: '/mbbs-india/jharkhand' },
      { label: 'Sikkim', href: '/mbbs-india/sikkim' },
      { label: 'Pondicherry', href: '/mbbs-india/pondicherry' },
      { label: 'Kerala', href: '/mbbs-india/kerala' },
      { label: 'West Bengal', href: '/mbbs-india/west-bengal' },
      { label: 'Tamil Nadu', href: '/mbbs-india/tamil-nadu' },
    ]
  },
  { 
    label: 'MBBS Abroad', 
    href: '/mbbs-abroad',
    submenu: [
      { label: 'Russia', href: '/mbbs-abroad/russia' },
      { label: 'Nepal', href: '/mbbs-abroad/nepal' },
      { label: 'Bangladesh', href: '/mbbs-abroad/bangladesh' },
      { label: 'Uzbekistan', href: '/mbbs-abroad/uzbekistan' },
      { label: 'Kazakhstan', href: '/mbbs-abroad/kazakhstan' },
      { label: 'Serbia', href: '/mbbs-abroad/serbia' },
      { label: 'Iran', href: '/mbbs-abroad/iran' },
      { label: 'Bosnia', href: '/mbbs-abroad/bosnia' },
      { label: 'Egypt', href: '/mbbs-abroad/egypt' },
      { label: 'Vietnam', href: '/mbbs-abroad/vietnam' },
      { label: 'Kyrgyzstan', href: '/mbbs-abroad/kyrgyzstan' },
      { label: 'Philippines', href: '/mbbs-abroad/philippines' },
      { label: 'Georgia', href: '/mbbs-abroad/georgia' },
      { label: 'China', href: '/mbbs-abroad/china' },
      { label: 'Romania', href: '/mbbs-abroad/romania' },
    ]
  },
  { 
    label: 'MD/MS', 
    href: '/md-ms',
    submenu: [
      { label: 'MD/MS in UP', href: '/md-ms/up' },
      { label: 'MD/MS in Karnataka', href: '/md-ms/karnataka' },
      { label: 'MD/MS in Haryana', href: '/md-ms/haryana' },
      { label: 'MD/MS in Madhya Pradesh', href: '/md-ms/mp' },
      { label: 'MD/MS in Chhattisgarh', href: '/md-ms/chhattisgarh' },
      { label: 'MD/MS in Rajasthan', href: '/md-ms/rajasthan' },
      { label: 'MD/MS in Maharashtra', href: '/md-ms/maharashtra' },
      { label: 'MD/MS in Uttarakhand', href: '/md-ms/uttarakhand' },
      { label: 'MD/MS in Tamil Nadu', href: '/md-ms/tamil-nadu' },
    ]
  },
  { 
    label: 'Latest Updates', 
    href: '/blog'
  },
  { 
    label: 'Contact', 
    href: '/contact'
  },
] as const;

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

// Social Links
export const SOCIAL_LINKS = [
  { platform: 'facebook', url: 'https://facebook.com/argroupedu' },
  { platform: 'instagram', url: 'https://instagram.com/argroupedu' },
  { platform: 'youtube', url: 'https://youtube.com/@argroupedu' },
  { platform: 'linkedin', url: 'https://linkedin.com/company/argroupedu' },
  { platform: 'twitter', url: 'https://twitter.com/argroupedu' },
  { platform: 'whatsapp', url: 'https://wa.me/919999999999' },
] as const;

// Contact Info
export const CONTACT_INFO = {
  phone: '+91 (800) 123-4567',
  email: 'info@argroup.edu',
  address: 'New Delhi, India',
  hours: 'Monday - Friday: 9:00 AM - 6:00 PM IST',
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
