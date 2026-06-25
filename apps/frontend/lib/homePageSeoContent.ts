/** Homepage SEO body + FAQ — sourced from Google Doc (exact copy). */

export const HOME_PAGE_H1 =
  'Medical Admission Guidance & MBBS Admission Consultancy for Future Medical Professionals';

export const HOME_PAGE_META_DESCRIPTION =
  'Professional Medical Admission Guidance and trusted MBBS Admission Consultancy for NEET aspirants. Expert admission counselling, MBBS in India & abroad, and MD/MS planning with AR Group of Education.';

export const HOME_INTERNAL_PATHS = {
  medicalAdmissionGuidance: '/',
  mbbsAdmissionConsultancy: '/about',
  admissionCounselling: '/services',
  medicalCollegeAdmissionAssistance: '/mbbs-india',
  mbbsAbroadConsultancy: '/mbbs-abroad',
  studyMbbsAbroadConsultancy: '/mbbs-abroad',
  neetAspirantsGuidance: '/neet-ug-counselling',
  studyMbbsInIndia: '/mbbs-india',
  mdMsAdmissionIndia: '/md-ms',
  neetUgCounselling: '/neet-ug-counselling',
  neetRankPredictor: '/neet-rank-predictor',
  russia: '/mbbs-abroad/russia',
  georgia: '/mbbs-abroad/georgia',
  kazakhstan: '/mbbs-abroad/kazakhstan',
  kyrgyzstan: '/mbbs-abroad/kyrgyzstan',
  uzbekistan: '/mbbs-abroad/uzbekistan',
  nepal: '/mbbs-abroad/nepal',
  bangladesh: '/mbbs-abroad/bangladesh',
  romania: '/mbbs-abroad/romania',
  serbia: '/mbbs-abroad/serbia',
} as const;

export const HOME_PAGE_FAQS = [
  {
    id: 'faq-1',
    question: 'Why choose AR Group of Education for medical admissions?',
    answer:
      'AR Group of Education offers expert counseling, transparent guidance, personalized support, and 21  years of experience in medical admissions.',
  },
  {
    id: 'faq-2',
    question: 'What makes AR Group of Education different from other consultants?',
    answer:
      'We provide end-to-end admission assistance, honest advice, and dedicated support for MBBS admissions in India and abroad.',
  },
  {
    id: 'faq-3',
    question: 'Why do students trust AR Group of Education?',
    answer:
      'Thousands of students trust us for our proven track record, experienced counselors, and commitment to helping them achieve their medical career goals.',
  },
  {
    id: 'faq-4',
    question: 'Does AR Group of Education support students after admission?',
    answer:
      'Yes, we provide post-admission support, including documentation assistance, visa guidance, travel support, and student assistance services.',
  },
  {
    id: 'faq-5',
    question: 'Is NEET required to study MBBS abroad?',
    answer:
      'Yes, Indian students must qualify NEET to pursue MBBS abroad and become eligible for medical licensing requirements in India.',
  },
  {
    id: 'faq-6',
    question: 'Can I practice in India after completing MBBS abroad?',
    answer:
      'Yes, graduates from NMC-approved foreign medical universities can practice in India after fulfilling the applicable licensing requirements.',
  },
  {
    id: 'faq-7',
    question: 'How can AR Group of Education help with MBBS abroad admissions?',
    answer:
      'We provide complete MBBS Abroad Consultancy services, including university selection, admission processing, visa assistance, accommodation guidance, and pre-departure support.',
  },
  {
    id: 'faq-8',
    question: 'How can AR Group of Education help with MBBS admission in India?',
    answer:
      'Our experts provide Medical Admission Guidance, NEET counselling support, college shortlisting, documentation assistance, and admission support for medical colleges across India.',
  },
  {
    id: 'faq-9',
    question: 'How can I get MD/MS admission in India?',
    answer:
      'Candidates must qualify NEET PG and participate in the counselling process. AR Group of Education helps with college selection, counselling guidance, and admission support for MD/MS Admission in India.',
  },
  {
    id: 'faq-10',
    question: 'What is the NEET Rank Predictor Tool?',
    answer:
      'estimates your expected rank based on your NEET score and helps you plan your admission strategy.',
    linkHref: HOME_INTERNAL_PATHS.neetRankPredictor,
    linkLabel: 'NEET Rank Predictor Tool',
    linkLeadIn: 'The',
  },
] as const;

export const HOME_ADMISSION_ASSISTANCE_STEPS = [
  'Shortlist suitable medical colleges',
  'Understand admission eligibility criteria',
  'Complete application forms accurately',
  'Prepare required documentation',
  'Participate in counseling rounds',
  'Evaluate available admission options',
  'Secure admission successfully',
] as const;

export const HOME_CONSULTANCY_BENEFITS = [
  'Personalized Career Counseling – Expert guidance based on your NEET score, budget, and career goals.',
  'College & University Selection Support – Help in choosing the right medical college in India or abroad.',
  'Admission Planning & Strategy – Customized admission roadmap to maximize your chances of selection.',
  'Documentation Assistance – Support with preparing and verifying admission documents.',
  'Counselling Registration Guidance – Assistance with registration, choice filling, and counselling procedures.',
  'Transparent Admission Support – Honest guidance with clear information on fees and admissions.',
  'Dedicated Student Assistance – Continuous support from counselling to final admission.',
] as const;

export const HOME_ABROAD_DESTINATIONS = [
  { name: 'Russia', description: 'Affordable MBBS programs with globally recognized medical universities.', href: HOME_INTERNAL_PATHS.russia },
  { name: 'Georgia', description: 'Modern medical education with international standards and English-medium courses.', href: HOME_INTERNAL_PATHS.georgia },
  { name: 'Kazakhstan', description: 'Quality medical training, affordable fees, and excellent clinical exposure.', href: HOME_INTERNAL_PATHS.kazakhstan },
  { name: 'Kyrgyzstan', description: 'Popular destination for Indian students due to low tuition fees and simple admission procedures.', href: HOME_INTERNAL_PATHS.kyrgyzstan },
  { name: 'Uzbekistan', description: 'NMC-recognized universities offering quality education at reasonable costs.', href: HOME_INTERNAL_PATHS.uzbekistan },
  { name: 'Nepal', description: 'Similar culture and curriculum with recognized medical colleges close to India.', href: HOME_INTERNAL_PATHS.nepal },
  { name: 'Bangladesh', description: 'High-quality medical education with a curriculum similar to Indian medical colleges.', href: HOME_INTERNAL_PATHS.bangladesh },
  { name: 'Romania', description: 'European-standard medical education with globally recognized degrees.', href: HOME_INTERNAL_PATHS.romania },
  { name: 'Serbia', description: 'Modern infrastructure, experienced faculty, and internationally accepted medical programs.', href: HOME_INTERNAL_PATHS.serbia },
] as const;

export const HOME_AR_SERVICES = [
  'Personalized Career Counseling: Personalized guidance to choose the right medical career path.',
  'Career Counseling: Expert advice on medical education and career opportunities.',
  'Admission Planning: Strategic planning for a smooth admission process.',
  'Medical College Admission Assistance: Complete support for medical college admissions.',
  'College Shortlisting: Helping students select the best-fit medical colleges.',
  'Documentation Review: Verification of admission documents for accuracy.',
  'Application Support: Assistance with application form submission.',
  'Counselling Assistance: Guidance during counselling and seat allocation.',
  'Visa Guidance: Support with visa applications for MBBS abroad.',
  'Travel Assistance: Help with travel and pre-departure arrangements.',
  'Post-Admission Support: Continued assistance after securing admission.',
] as const;

export const HOME_DIFFERENTIATORS = [
  '21+ Years of Experience – Trusted guidance backed by decades of expertise in medical admissions.',
  'Personalized Admission Support – Tailored solutions based on your profile, goals, and budget.',
  'Expert Medical Admission Guidance – Professional counseling for MBBS, BDS, MD, and MS admissions.',
  'Trusted MBBS Admission Consultancy – Reliable support throughout the admission journey.',
  'Comprehensive MBBS Abroad Consultancy – Complete assistance for admissions in top international medical universities.',
  'Transparent Counseling Process – Honest advice with clear information and no hidden commitments.',
  'Dedicated Student Assistance – Continuous support from counselling to final admission.',
  'Support for MBBS, BDS, MD & MS Admissions – Guidance for undergraduate and postgraduate medical programs.',
  'NEET UG Counselling Expertise – Strategic support for choice filling, counselling, and seat allocation.',
  'Proven Track Record of Student Success – Thousands of successful admissions across India and abroad.',
] as const;
