'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Building2, Globe, MapPin, Sparkles } from 'lucide-react';
import type { CollegeMatch } from '@/lib/neetRankPredictor/collegeMatches';

function chanceClass(chance?: CollegeMatch['chance']) {
  if (chance === 'high') return 'cp-chance--high';
  if (chance === 'reach') return 'cp-chance--reach';
  return 'cp-chance--mid';
}

function collegeKey(c: CollegeMatch, index: number, scope = ''): string {
  return [scope, c.href, c.name, c.closingRank ?? '', c.collegeType ?? '', index].join('::');
}

function CollegeCard({ c, index }: { c: CollegeMatch; index: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.35), duration: 0.35, ease: 'easeOut' }}
    >
      <Link href={c.href || '/contact'} className={`cp-college-card ${chanceClass(c.chance)}`}>
        <span className="cp-college-card__rail" aria-hidden />
        <div className="cp-college-card__top">
          <span className="cp-college-card__type">
            <Building2 className="h-3 w-3" aria-hidden />
            {c.collegeType ?? 'College'}
          </span>
          <span className="cp-college-card__go" aria-hidden>
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
        <p className="cp-college-card__name">{c.name}</p>
        <p className="cp-college-card__meta">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
          {c.meta}
        </p>
        {c.badge ? (
          <div className="cp-college-card__footer">
            <span className="cp-college-card__badge">{c.badge}</span>
          </div>
        ) : null}
      </Link>
    </motion.li>
  );
}

function CollegeGrid({
  title,
  icon: Icon,
  colleges,
  emptyMessage,
  groupByState,
  tone = 'navy',
}: {
  title: string;
  icon: typeof MapPin;
  colleges: CollegeMatch[];
  emptyMessage?: string;
  groupByState?: boolean;
  tone?: 'navy' | 'gold';
}) {
  if (!colleges.length) {
    return emptyMessage ? (
      <p className="cp-empty">{emptyMessage}</p>
    ) : null;
  }

  if (groupByState) {
    const groups = new Map<string, CollegeMatch[]>();
    for (const c of colleges) {
      const key = c.meta || 'Other';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    }
    const states = [...groups.keys()].sort((a, b) => a.localeCompare(b));
    let cardIndex = 0;

    return (
      <div className={`cp-results-block cp-results-block--${tone}`}>
        <div className="cp-results-block__head">
          <span className="cp-results-block__icon">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="cp-results-block__title">{title}</h3>
            <p className="cp-results-block__count">
              {colleges.length} match{colleges.length === 1 ? '' : 'es'} · {states.length} region
              {states.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="cp-state-stack">
          {states.map((state, sIdx) => {
            const list = groups.get(state)!;
            return (
              <motion.section
                key={state}
                className="cp-state-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(sIdx * 0.05, 0.4), duration: 0.4 }}
              >
                <header className="cp-state-panel__head">
                  <div className="cp-state-panel__label">
                    <span className="cp-state-panel__pin" aria-hidden />
                    <h4>{state}</h4>
                  </div>
                  <span className="cp-state-panel__count">
                    {list.length} college{list.length === 1 ? '' : 's'}
                  </span>
                </header>
                <ul className="cp-college-grid">
                  {list.map((c, localIdx) => {
                    const i = cardIndex++;
                    return (
                      <CollegeCard key={collegeKey(c, localIdx, state)} c={c} index={i} />
                    );
                  })}
                </ul>
              </motion.section>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`cp-results-block cp-results-block--${tone}`}>
      <div className="cp-results-block__head">
        <span className="cp-results-block__icon">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h3 className="cp-results-block__title">{title}</h3>
          <p className="cp-results-block__count">
            {colleges.length} option{colleges.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>
      <ul className="cp-college-grid">
        {colleges.map((c, i) => (
          <CollegeCard key={collegeKey(c, i, 'flat')} c={c} index={i} />
        ))}
      </ul>
    </div>
  );
}

export function NeetRankCollegeResults({
  india,
  abroad,
  track,
  title,
  subtitle,
  disclaimer,
}: {
  india: CollegeMatch[];
  abroad: CollegeMatch[];
  track: 'india' | 'abroad' | 'md-ms' | 'bams';
  title?: string;
  subtitle?: string;
  disclaimer?: string;
}) {
  const programOnly = track === 'md-ms' || track === 'bams';

  return (
    <div className="cp-results">
      <div className="cp-results__intro">
        <span className="cp-results__eyebrow">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          AR Group shortlist
        </span>
        <h3 className="cp-results__title">
          {title ??
            (programOnly
              ? 'Options for your programme'
              : track === 'abroad'
                ? 'MBBS Abroad colleges for your profile'
                : 'Colleges that fit this rank')}
        </h3>
        <p className="cp-results__sub">
          {subtitle ??
            (programOnly
              ? 'Shortlisted pathways from AR Group — tap for details or talk to a counsellor.'
              : 'Indicative MCC AIQ closing ranks for your category — grouped so you can scan by state.')}
        </p>
      </div>

      {track === 'md-ms' ? (
        <CollegeGrid
          title="MD/MS colleges — state-wise"
          icon={MapPin}
          colleges={india}
          groupByState
          emptyMessage="No indicative MD/MS college match was found for this NEET PG AIR and category. Talk to our counsellor for branch-wise options."
        />
      ) : null}

      {track === 'bams' ? (
        <CollegeGrid
          title="BAMS pathways"
          icon={Globe}
          colleges={india}
          emptyMessage="Explore BAMS college options with our counsellors."
        />
      ) : null}

      {track === 'india' ? (
        <CollegeGrid
          title="MBBS in India — state-wise"
          icon={MapPin}
          colleges={india}
          groupByState
          emptyMessage="No matching colleges found for this AIR & category. Try Abroad / BAMS, or talk to our counsellor."
        />
      ) : null}

      {track === 'abroad' ? (
        <CollegeGrid
          title="MBBS Abroad — by country"
          icon={Globe}
          colleges={abroad}
          groupByState
          tone="gold"
          emptyMessage="Explore MBBS Abroad destinations with our counsellors."
        />
      ) : null}

      {disclaimer ? <p className="cp-disclaimer">{disclaimer}</p> : null}
    </div>
  );
}
