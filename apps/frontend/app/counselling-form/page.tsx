import type { Metadata } from 'next';
import { YoutubeLeadLanding } from '@/components/yt/YoutubeLeadLanding';

export const metadata: Metadata = {
  title: 'Counselling Form | Free MBBS Admission Help',
  description:
    'Fill the counselling form for a free callback on MBBS India & Abroad, MD/MS and BAMS from AR Group of Education.',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    title: 'Counselling Form | AR Group of Education',
    description:
      'Request free MBBS / MD-MS / BAMS counselling. Our experts will call you back.',
  },
};

/** YouTube / campaign counselling form — not in main nav; noindex. */
export default function CounsellingFormPage() {
  return <YoutubeLeadLanding />;
}
