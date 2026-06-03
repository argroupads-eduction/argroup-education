export type Testimonial = {
  id: string;
  name: string;
  university: string;
  country: string;
  review: string;
  rating: number;
  source?: 'google' | 'static';
  authorPhotoUrl?: string | null;
  publishedAt?: string | null;
};

/** Fallback when Google reviews API / cache is unavailable */
export const fallbackTestimonials: Testimonial[] = [
  {
    id: 'fallback-1',
    name: 'Priya Sharma',
    university: 'Kazan Federal University',
    country: 'Russia',
    review:
      'AR Group guided me through NEET counselling and university selection in Russia. Visa and hostel paperwork were handled smoothly—I started MBBS on time.',
    rating: 5,
    source: 'static',
  },
  {
    id: 'fallback-2',
    name: 'Rahul Patel',
    university: 'Tbilisi State Medical University',
    country: 'Georgia',
    review:
      'Transparent fee structure and honest comparisons helped me choose Georgia. The team stayed available on WhatsApp even after I landed in Tbilisi.',
    rating: 5,
    source: 'static',
  },
  {
    id: 'fallback-3',
    name: 'Ananya Gupta',
    university: 'Al-Farabi Kazakh National University',
    country: 'Kazakhstan',
    review:
      'From document verification to airport pickup coordination, AR Group made my first year abroad stress-free. Highly recommend for Kazakhstan MBBS.',
    rating: 5,
    source: 'static',
  },
  {
    id: 'fallback-4',
    name: 'Sneha Reddy',
    university: 'Grant Medical College (via NEET)',
    country: 'India',
    review:
      "AR Group's India MBBS counselling helped me secure a government seat in Maharashtra. Their state-wise cut-off analysis was spot on.",
    rating: 5,
    source: 'static',
  },
  {
    id: 'fallback-5',
    name: 'Imran Hossain',
    university: 'Dhaka National Medical College',
    country: 'Bangladesh',
    review:
      'As an Indian student, I needed clarity on SAARC quotas and NMC compliance. AR Group handled every form and embassy appointment.',
    rating: 5,
    source: 'static',
  },
];
