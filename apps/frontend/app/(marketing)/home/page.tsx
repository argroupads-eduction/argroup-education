import { Metadata } from 'next';
import { getMbbsHeroFallbackForm } from '@/lib/mbbsHeroFormFallback';
import { loadMbbsHeroFormDefinitionsServer } from '@/lib/mbbsHeroFormDefinitionServer';
import { HeroSection } from '@/sections/home/HeroSection';
import { MBBSIndiaStateSection } from '@/sections/home/MBBSIndiaStateSection';
import { AboutSection } from '@/sections/home/AboutSection';
import { MbbsAbroadScrollSection } from '@/sections/home/MbbsAbroadScrollSection';
import { CounsellingFormSection } from '@/sections/home/CounsellingFormSection';
import { AchievementsSection } from '@/sections/home/AchievementsSection';
import { TestimonialsSection } from '@/sections/home/TestimonialsSection';
import { FAQSection } from '@/sections/home/FAQSection';

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
      <MBBSIndiaStateSection />
      <AboutSection />
      <MbbsAbroadScrollSection />
      <CounsellingFormSection />
      <AchievementsSection />
      <TestimonialsSection />
      <FAQSection />
    </>
  );
}
