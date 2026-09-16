import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { CollegeCardImage } from '@/components/mbbs/CollegeCardImage';
import { resolveCollegeImageUrl } from '@/lib/collegeImageIndex';

export type PremiumCollegeItem = {
  name: string;
  href: string;
  city?: string;
  image?: string | null;
  slug?: string | null;
};

type PremiumCollegeCardProps = {
  college: PremiumCollegeItem;
  theme?: 'india' | 'abroad';
  variant?: 'default' | 'compact' | 'featured';
  index?: number;
};

export function PremiumCollegeCard({
  college,
  theme = 'india',
  variant = 'default',
}: PremiumCollegeCardProps) {
  const badgeBg = theme === 'india' ? 'bg-navy-900' : 'bg-blue-900';
  const badgeLabel = theme === 'india' ? 'MBBS India' : 'MBBS Abroad';
  const slugFromHref = college.href?.replace(/^\/+/, '').split('/')[0] ?? null;
  const imageSrc = resolveCollegeImageUrl(college.slug ?? slugFromHref, college.image, college.name);

  if (variant === 'compact') {
    return (
      <Link
        href={college.href}
        className="group flex items-start justify-between gap-2 rounded-xl px-2.5 py-2 transition hover:bg-slate-50/90"
      >
        {imageSrc ? (
          <CollegeCardImage src={imageSrc} alt={college.name} variant="compact" />
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium leading-snug text-navy-900 group-hover:text-gold-700">
            {college.name}
          </span>
          {college.city ? (
            <span className="mt-0.5 block text-xs text-slate-500">{college.city}</span>
          ) : null}
        </span>
        <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-gold-500" />
      </Link>
    );
  }

  return (
    <Link
      href={college.href}
      className={[
        'group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm ring-1 ring-black/[0.02] transition duration-300',
        'hover:-translate-y-0.5 hover:border-gold-300/60 hover:shadow-xl hover:shadow-navy-900/10',
        variant === 'featured' ? 'md:min-h-[20rem]' : '',
      ].join(' ')}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/80">
        <CollegeCardImage src={imageSrc} alt={college.name} />
      </div>

      <div className="relative z-10 flex flex-1 flex-col bg-white p-4 pt-3">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <span
            className={`inline-flex rounded-full ${badgeBg} px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white`}
          >
            {badgeLabel}
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-gold-50 group-hover:text-gold-600">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
        <h3 className="line-clamp-3 text-base font-semibold leading-snug text-navy-900 transition group-hover:text-gold-800 md:text-lg">
          {college.name}
        </h3>
        {college.city ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gold-500" aria-hidden />
            {college.city}
          </p>
        ) : null}
        <p className="mt-auto pt-3 text-xs font-semibold uppercase tracking-wide text-gold-800 transition group-hover:text-gold-900">
          View full details
        </p>
      </div>
    </Link>
  );
}
