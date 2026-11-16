/** Homepage SEO body + FAQ — sourced from Google Doc (exact copy). */

export const HOME_PAGE_H1 =
  'Medical Admission Guidance & MBBS Admission Consultancy for Future Medical Professionals';

export const HOME_PAGE_META_DESCRIPTION =
  'Counselling for MBBS in India & abroad, MD/MS in India and NEET UG/PG options. Share your NEET score and book a free session with AR Group of Education.';

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
      'We focus on clear counselling, honest fee information and personalised college shortlisting. We do not guarantee admission; we help you understand your options and complete the process correctly.',
  },
  {
    id: 'faq-3',
    question: 'Why do students trust AR Group of Education?',
    answer:
      'Students and parents have counselled with us since 2005, and we share information openly. Please verify any consultancy, including us, before making a payment.',
  },
  {
    id: 'faq-4',
    question: 'Does AR Group of Education support students after admission?',
    answer:
      'Yes. For MBBS abroad we support documentation, visa and pre-departure briefing, and we stay in touch with parents after admission.',
  },
  {
    id: 'faq-5',
    question: 'Is NEET required to study MBBS abroad?',
    answer:
      'Under NMC rules, Indian students who plan to practise in India after MBBS abroad generally need to qualify NEET. Please check the latest NMC notice before applying.',
  },
  {
    id: 'faq-6',
    question: 'Can I practice in India after completing MBBS abroad?',
    answer:
      'Yes, if you meet NMC eligibility conditions and pass the screening exam NMC requires (currently FMGE). Please check the NMC website for the latest rules.',
  },
  {
    id: 'faq-7',
    question: 'How can AR Group of Education help with MBBS abroad admissions?',
    answer:
      'We guide you on country and university options, eligibility, documents, visa and pre-departure steps. Final admission depends on the university’s rules and your eligibility.',
  },
  {
    id: 'faq-8',
    question: 'How can AR Group of Education help with MBBS admission in India?',
    answer:
      'We guide you through NEET UG counselling, college shortlisting by rank and category, and documents. Seats are allotted only through MCC and state counselling.',
  },
  {
    id: 'faq-9',
    question: 'How can I get MD/MS admission in India?',
    answer:
      'MD/MS admission in India is through NEET PG counselling by MCC and state authorities. We guide you on scores, college options and counselling steps. Our MD/MS guidance is for India only.',
  },
  {
    id: 'faq-10',
    question: 'What is the NEET Rank Predictor Tool?',
    answer:
      'It estimates your possible rank from your NEET score. It is only an estimate; the official rank is issued by NTA.',
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
  '21+ Years of Experience – Guidance built over two decades of medical admission counselling.',
  'Personalized Admission Support – Tailored solutions based on your profile, goals, and budget.',
  'BAMS and BDS Counselling – Guidance on eligibility, NEET score and college options for BAMS and BDS.',
  'Support Through the Journey – Help with shortlisting, counselling steps and documents.',
  'MBBS Abroad Guidance – Help with university selection, documents and visa for Indian students.',
  'Transparent Counseling Process – Honest advice with clear information and no hidden commitments.',
  'Dedicated Student Assistance – Continuous support from counselling to final admission.',
  'MBBS and MD/MS in India – Guidance for MBBS admission and MD/MS admission through NEET PG counselling in India.',
  'NEET UG Counselling Guidance – Support with choice filling, counselling rounds and seat allotment rules.',
  'Support From Counselling to Reporting – Admission depends on NEET score, eligibility and seat availability. We do not guarantee any seat.',
] as const;
