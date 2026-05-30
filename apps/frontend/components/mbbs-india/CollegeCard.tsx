import { PremiumCollegeCard, type PremiumCollegeItem } from '@/components/mbbs/PremiumCollegeCard';
import type { MbbsIndiaCollege } from '@/lib/mbbsIndiaTree';

type CollegeCardProps = {
  college: MbbsIndiaCollege;
  variant?: 'default' | 'compact' | 'featured';
  index?: number;
};

export function CollegeCard({ college, variant, index }: CollegeCardProps) {
  const item: PremiumCollegeItem = {
    name: college.name,
    href: college.href,
    city: college.city,
    image: college.image,
  };
  return <PremiumCollegeCard college={item} theme="india" variant={variant} index={index} />;
}
