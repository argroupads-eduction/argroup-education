'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { HorizontalScrollItem, HorizontalScrollRow } from '@/components/ui/HorizontalScrollRow';
import { MBBS_INDIA_STATES } from '@/lib/mbbsIndiaTree';

function stateCoverImage(stateId: string) {
  const state = MBBS_INDIA_STATES.find((s) => s.id === stateId);
  return state?.colleges.find((c) => c.image)?.image ?? null;
}

export function MbbsIndiaHubExplorer() {
  return (
    <section className="program-hub-section program-hub-section--soft">
      <div className="mx-auto max-w-7xl px-4">
        <div className="program-hub-section-head">
          <p className="program-hub-section-kicker">Explore by state</p>
          <h2 className="program-hub-section-title">Every state. Every college. One guide.</h2>
          <p className="program-hub-section-desc">
            Swipe through states or use arrows — each hub lists fees, eligibility, and college pages migrated
            from argroupofeducation.com.
          </p>
        </div>
        <HorizontalScrollRow ariaLabel="MBBS India states" autoScrollMobile gapClassName="gap-4">
          {MBBS_INDIA_STATES.map((state) => {
            const image = stateCoverImage(state.id) ?? state.colleges[0]?.image;
            return (
              <HorizontalScrollItem key={state.id} className="w-[17rem] sm:w-[18.5rem]">
                <Link href={state.href} className="program-hub-card group block h-full">
                  <div className="program-hub-card-media">
                    {image ? (
                      <Image
                        src={image}
                        alt=""
                        width={280}
                        height={180}
                        className="max-h-[6.5rem] w-auto max-w-full object-contain"
                        unoptimized
                      />
                    ) : (
                      <GraduationCap className="h-10 w-10 text-slate-300" aria-hidden />
                    )}
                  </div>
                  <div className="program-hub-card-body">
                    <h3 className="program-hub-card-title">{state.name}</h3>
                    <p className="program-hub-card-meta">{state.colleges.length} MBBS colleges</p>
                    <span className="program-hub-card-link inline-flex items-center gap-1">
                      View state hub
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </HorizontalScrollItem>
            );
          })}
        </HorizontalScrollRow>
      </div>
    </section>
  );
}
