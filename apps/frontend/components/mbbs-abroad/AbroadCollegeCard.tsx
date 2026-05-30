import { PremiumCollegeCard, type PremiumCollegeItem } from '@/components/mbbs/PremiumCollegeCard';
import type { MbbsAbroadCollege } from '@/lib/mbbsAbroadTree';

type AbroadCollegeCardProps = {
  college: MbbsAbroadCollege;
  variant?: 'default' | 'compact' | 'featured';
  index?: number;
};

export function AbroadCollegeCard({ college, variant, index }: AbroadCollegeCardProps) {
  const item: PremiumCollegeItem = { name: college.name, href: college.href };
  return <PremiumCollegeCard college={item} theme="abroad" variant={variant} index={index} />;
}
