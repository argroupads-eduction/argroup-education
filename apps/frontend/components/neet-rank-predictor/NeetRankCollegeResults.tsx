'use client';

import Link from 'next/link';
import { ArrowUpRight, Globe, MapPin } from 'lucide-react';
import type { CollegeMatch } from '@/lib/neetRankPredictor/collegeMatches';

function CollegeGrid({
  title,
  icon: Icon,
  accent,
  colleges,
  emptyMessage,
}: {
  title: string;
  icon: typeof MapPin;
  accent: string;
  colleges: CollegeMatch[];
  emptyMessage?: string;
}) {
  if (!colleges.length) {
    return emptyMessage ? (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    ) : null;
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-sm ${accent}`}>
          <Icon className="h-4 w-4 text-white" aria-hidden />
        </span>
        <h3 className="font-serif text-lg font-bold text-navy-900">{title}</h3>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {colleges.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-gold-400 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold leading-snug text-navy-900 group-hover:text-gold-700">
                  {c.name}
                </p>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-gold-600" />
              </div>
              <p className="mt-1 text-xs text-slate-500">{c.meta}</p>
              {c.badge ? (
                <span className="mt-3 inline-flex w-fit rounded-full bg-gold-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-800">
                  {c.badge}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NeetRankCollegeResults({
  india,
  abroad,
  track,
}: {
  india: CollegeMatch[];
  abroad: CollegeMatch[];
  track: 'india' | 'abroad' | 'md-ms' | 'bams';
}) {
  const programOnly = track === 'md-ms' || track === 'bams';

  return (
    <div className="space-y-8 border-t border-slate-100 pt-8">
      <div>
        <h3 className="font-serif text-xl font-bold text-navy-900 md:text-2xl">
          {programOnly ? 'Counselling for your programme' : 'Colleges matched to your score'}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {programOnly
            ? 'Our counsellors will call you with MD/MS or BAMS college options based on your NEET rank and budget.'
            : 'Shortlisted options from AR Group, tap any college for fees, eligibility & counselling.'}
        </p>
      </div>

      {programOnly ? (
        <CollegeGrid
          title={track === 'md-ms' ? 'MD/MS pathways' : 'BAMS pathways'}
          icon={Globe}
          accent="bg-gradient-to-br from-navy-800 to-navy-600"
          colleges={[]}
          emptyMessage={
            track === 'md-ms'
              ? 'Explore MD/MS admission guidance with our counsellors.'
              : 'Explore BAMS college options with our counsellors.'
          }
        />
      ) : null}

      {!programOnly && track === 'india' && (
        <CollegeGrid
          title="MBBS in India"
          icon={MapPin}
          accent="bg-gradient-to-br from-navy-800 to-navy-600"
          colleges={india}
          emptyMessage="Explore MBBS India options with our counsellors."
        />
      )}

      {!programOnly && track === 'abroad' && (
        <CollegeGrid
          title="MBBS Abroad"
          icon={Globe}
          accent="bg-gradient-to-br from-gold-500 to-amber-600"
          colleges={abroad}
          emptyMessage="Explore MBBS Abroad destinations with our counsellors."
        />
      )}
    </div>
  );
}
