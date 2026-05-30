'use client';

import Link from 'next/link';
import { ArrowRight, Stethoscope } from 'lucide-react';
import { HorizontalScrollItem, HorizontalScrollRow } from '@/components/ui/HorizontalScrollRow';
import { MD_MS_NAV_ITEMS } from '@/lib/mdMsNav';

export function MdMsHubExplorer() {
  return (
    <section className="program-hub-section program-hub-section--soft">
      <div className="mx-auto max-w-7xl px-4">
        <div className="program-hub-section-head">
          <p className="program-hub-section-kicker">State-wise PG guidance</p>
          <h2 className="program-hub-section-title">MD/MS counselling by state</h2>
          <p className="program-hub-section-desc">
            Select your state for seat matrix insights, eligibility, and personalized MD/MS admission
            counselling.
          </p>
        </div>
        <HorizontalScrollRow ariaLabel="MD MS states" autoScrollMobile gapClassName="gap-4">
          {MD_MS_NAV_ITEMS.map((item) => (
            <HorizontalScrollItem key={item.href} className="w-[15rem] sm:w-[16rem]">
              <Link href={item.href} className="program-hub-card group block h-full">
                <div className="program-hub-card-media">
                  <Stethoscope className="h-10 w-10 text-indigo-400/80" aria-hidden />
                </div>
                <div className="program-hub-card-body">
                  <span className="inline-flex w-fit rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    {item.shortLabel}
                  </span>
                  <h3 className="program-hub-card-title mt-2">{item.label}</h3>
                  <span className="program-hub-card-link inline-flex items-center gap-1">
                    View guidance
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </HorizontalScrollItem>
          ))}
        </HorizontalScrollRow>
      </div>
    </section>
  );
}
