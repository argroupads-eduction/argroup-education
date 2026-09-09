import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { getSiteUrl } from '@/lib/siteUrl';
import { HOME_PAGE_META_DESCRIPTION } from '@/lib/homePageSeoContent';
import { HomeHeroClient } from '@/sections/home/HomeHeroClient';
import { CollegePredictorHomeSection } from '@/sections/home/CollegePredictorHomeSection';
import { MBBSIndiaStateSection } from '@/sections/home/MBBSIndiaStateSection';
import { MbbsAbroadScrollSection } from '@/sections/home/MbbsAbroadScrollSection';
import { LazySection } from '@/components/common/LazySection';
import { HomeFaqJsonLd } from '@/components/home/HomeFaqJsonLd';
import { HomeWebPageJsonLd } from '@/components/seo/HomeWebPageJsonLd';
import '@/styles/mbbs-abroad-atlas.css';

const HomeSeoContentSections = dynamic(
  () =>
    import('@/sections/home/HomeSeoContentSections').then((m) => ({
      default: m.HomeSeoContentSections,
    }))
);

const AboutSection = dynamic(() =>
  import('@/sections/home/AboutSection').then((m) => ({ default: m.AboutSection }))
);
const YoutubeChannelSection = dynamic(() =>
  import('@/sections/home/YoutubeChannelSection').then((m) => ({ default: m.YoutubeChannelSection }))
);
const CounsellingFormSection = dynamic(() =>
  import('@/sections/home/CounsellingFormSection').then((m) => ({ default: m.CounsellingFormSection }))
);
const AchievementsSection = dynamic(() =>
  import('@/sections/home/AchievementsSection').then((m) => ({ default: m.AchievementsSection }))
);
const TestimonialsSection = dynamic(() =>
  import('@/sections/home/TestimonialsSection').then((m) => ({ default: m.TestimonialsSection }))
);
const FAQSection = dynamic(() =>
  import('@/sections/home/FAQSection').then((m) => ({ default: m.FAQSection }))
);

const SITE = getSiteUrl();

/** ISR — warmer Amplify HTML for homepage (field TTFB support). */
export const revalidate = 300;

const HOME_SEO_TITLE = 'Medical Admission Guidance | MBBS Admission Consultancy';
const HOME_SEO_DESCRIPTION = HOME_PAGE_META_DESCRIPTION;

export const metadata: Metadata = {
  title: HOME_SEO_TITLE,
  description: HOME_SEO_DESCRIPTION,
  keywords: [
    'Medical Admission Guidance',
    'MBBS Admission Consultancy',
    'Admission Counselling for Medical Students',
    'Medical College Admission Assistance',
    'MBBS Abroad Consultancy',
    'Medical Admission Guidance for NEET Aspirants',
    'MD MS Admission in India',
    'NEET UG Counselling',
  ],
  alternates: {
    canonical: `${SITE}/`,
  },
  openGraph: {
    title: HOME_SEO_TITLE,
    description: HOME_SEO_DESCRIPTION,
    url: SITE,
    type: 'website',
    locale: 'en_IN',
    siteName: 'AR Group of Education',
    images: [{ url: '/ar-group-logo.png', width: 512, height: 512, alt: 'AR Group of Education' }],
  },
  twitter: {
    card: 'summary',
    title: HOME_SEO_TITLE,
    description: HOME_SEO_DESCRIPTION,
    images: ['/ar-group-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Homepage section order matches production https://www.argroupofeducation.com/
 * Hero stays without Quick Enquiry forms (local product change).
 */
export default async function HomePage() {
  return (
    <>
      <HomeWebPageJsonLd />
      <HomeFaqJsonLd />
      <HomeHeroClient />
      <CollegePredictorHomeSection />
      <MBBSIndiaStateSection />
      <LazySection minHeight="24rem">
        <AboutSection />
      </LazySection>
      <LazySection minHeight="26rem">
        <YoutubeChannelSection />
      </LazySection>
      {/* SSR: country links must stay in HTML for crawl/indexing */}
      <MbbsAbroadScrollSection />
      <LazySection minHeight="20rem">
        <CounsellingFormSection />
      </LazySection>
      <LazySection minHeight="22rem">
        <AchievementsSection />
      </LazySection>
      {/* SSR: primary H1 + editorial SEO body + internal links */}
      <HomeSeoContentSections />
      {/* SSR: FAQ visible text (JSON-LD already present) */}
      <FAQSection />
      <LazySection minHeight="20rem">
        <TestimonialsSection />
      </LazySection>
    </>
  );
}
