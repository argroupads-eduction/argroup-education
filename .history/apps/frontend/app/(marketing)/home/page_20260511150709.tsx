import { Metadata } from 'next';
import { HeroSection } from '@/sections/home/HeroSection';
import { ServicesSection } from '@/sections/home/ServicesSection';
import { CountriesSection } from '@/sections/home/CountriesSection';
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

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <CountriesSection />
      <CounsellingFormSection />
      <AchievementsSection />
      <TestimonialsSection />
      <FAQSection />
    </>
  );
}
