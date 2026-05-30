import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';

export type PremiumCollegeItem = {
  name: string;
  href: string;
  city?: string;
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
  index = 0,
}: PremiumCollegeCardProps) {
  const accent = index % 3;
  const badgeBg = theme === 'india' ? 'bg-navy-900' : 'bg-blue-900';
  const badgeLabel = theme === 'india' ? 'MBBS India' : 'MBBS Abroad';

  if (variant === 'compact') {
    return (
      <Link
        href={college.href}
        className="group flex items-start justify-between gap-2 rounded-xl px-2.5 py-2 transition hover:bg-slate-50/90"
      >
        <span className="min-w-0">
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

  const gradients = [
    'from-navy-900/90 via-navy-800/70 to-gold-500/30',
    'from-gold-400/25 via-white to-navy-900/5',
    'from-slate-100 via-white to-blue-50/80',
  ];

  return (
    <Link
      href={college.href}
      className={[
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm ring-1 ring-black/[0.02] transition duration-300',
        'hover:-translate-y-1 hover:border-gold-300/50 hover:shadow-xl hover:shadow-navy-900/10',
        variant === 'featured' ? 'md:p-6' : '',
      ].join(' ')}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradients[accent]} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
        aria-hidden
      />
      <div className="relative flex flex-1 flex-col">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span
            className={`inline-flex rounded-full ${badgeBg} px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white`}
          >
            {badgeLabel}
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-gold-50 group-hover:text-gold-600">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
        <h3 className="line-clamp-3 text-base font-semibold leading-snug text-navy-900 md:text-lg">
          {college.name}
        </h3>
        {college.city ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gold-500" aria-hidden />
            {college.city}
          </p>
        ) : null}
        <p className="mt-auto pt-4 text-xs font-semibold uppercase tracking-wide text-gold-700 opacity-0 transition group-hover:opacity-100">
          View full details
        </p>
      </div>
    </Link>
  );
}
