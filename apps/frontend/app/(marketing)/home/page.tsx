import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { getMbbsHeroFallbackForm } from '@/lib/mbbsHeroFormFallback';
import { loadMbbsHeroFormDefinitionsServer } from '@/lib/mbbsHeroFormDefinitionServer';
import { HeroSection } from '@/sections/home/HeroSection';
import { NeetRankPredictorHomeSection } from '@/sections/home/NeetRankPredictorHomeSection';
import { LazySection } from '@/components/common/LazySection';

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

export const metadata: Metadata = {
  title: 'Home - Medical Education Consultancy',
  description:
    'Join 4000+ students who achieved their MBBS dreams abroad. Expert guidance, 500+ universities, 98% visa success rate.',
  openGraph: {
    title: 'AR Group of Education | MBBS Abroad Consultancy',
    description:
      'Premium educational consultancy for medical education abroad. Expert guidance for MBBS admission and visa.',
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
      <LazySection minHeight="20rem">
        <TestimonialsSection />
      </LazySection>
      <LazySection minHeight="18rem">
        <FAQSection />
      </LazySection>
    </>
  );
}
