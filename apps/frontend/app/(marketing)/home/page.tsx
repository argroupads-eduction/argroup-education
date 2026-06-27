import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { getSiteUrl } from '@/lib/siteUrl';
import { getMbbsHeroFallbackForm } from '@/lib/mbbsHeroFormFallback';
import { loadMbbsHeroFormDefinitionsServer } from '@/lib/mbbsHeroFormDefinitionServer';
import { HeroSection } from '@/sections/home/HeroSection';
import { NeetRankPredictorHomeSection } from '@/sections/home/NeetRankPredictorHomeSection';
import { LazySection } from '@/components/common/LazySection';
import { HomeFaqJsonLd } from '@/components/home/HomeFaqJsonLd';

const HomeSeoContentSections = dynamic(
  () =>
    import('@/sections/home/HomeSeoContentSections').then((m) => ({
      default: m.HomeSeoContentSections,
    }))
);

const MBBSIndiaStateSection = dynamic(
  () => import('@/sections/home/MBBSIndiaStateSection').then((m) => ({ default: m.MBBSIndiaStateSection }))
);
const AboutSection = dynamic(() =>
  import('@/sections/home/AboutSection').then((m) => ({ default: m.AboutSection }))
);
const MbbsAbroadScrollSection = dynamic(() =>
  import('@/sections/home/MbbsAbroadScrollSection').then((m) => ({ default: m.MbbsAbroadScrollSection }))
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

const HOME_SEO_TITLE = 'Medical Admission Guidance | MBBS Admission Consultancy';
const HOME_SEO_DESCRIPTION =
  "Secure your seat with India's trusted MBBS admission consultancy. Get expert medical admission guidance for top colleges in India and abroad. Call today!";

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

export default async function HomePage() {
  let forms: Awaited<ReturnType<typeof loadMbbsHeroFormDefinitionsServer>>;
  try {
    forms = await loadMbbsHeroFormDefinitionsServer();
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[home] Hero form prefetch failed; client will retry.', e);
    }
    forms = {
      india: { ok: false, message: 'Prefetch skipped', status: 503 },
      abroad: { ok: false, message: 'Prefetch skipped', status: 503 },
    };
  }

  return (
    <>
      <HomeFaqJsonLd />
      <HeroSection
        initialForms={{
          india: forms.india.ok ? forms.india.doc : getMbbsHeroFallbackForm('india'),
          abroad: forms.abroad.ok ? forms.abroad.doc : getMbbsHeroFallbackForm('abroad'),
        }}
      />
      <NeetRankPredictorHomeSection />
      <LazySection minHeight="22rem">
        <MBBSIndiaStateSection />
      </LazySection>
      <LazySection minHeight="24rem">
        <AboutSection />
      </LazySection>
      <LazySection minHeight="28rem">
        <MbbsAbroadScrollSection />
      </LazySection>
      <LazySection minHeight="20rem">
        <CounsellingFormSection />
      </LazySection>
      <LazySection minHeight="22rem">
        <AchievementsSection />
      </LazySection>
      <LazySection minHeight="24rem">
        <HomeSeoContentSections />
      </LazySection>
      <LazySection minHeight="18rem">
        <FAQSection />
      </LazySection>
      <LazySection minHeight="20rem">
        <TestimonialsSection />
      </LazySection>
    </>
  );
}
