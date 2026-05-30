'use client';

import Link from 'next/link';
import { ArrowUpRight, Stethoscope } from 'lucide-react';
import { NavMegaMenuShell } from '@/components/common/NavMegaMenuShell';
import { MD_MS_NAV_ITEMS } from '@/lib/mdMsNav';

type MdMsNavMegaMenuProps = {
  onNavigate?: () => void;
};

export function MdMsNavMegaMenu({ onNavigate }: MdMsNavMegaMenuProps) {
  return (
    <NavMegaMenuShell
      theme="mdms"
      title="MD / MS Admissions"
      description="Postgraduate medical programs across top Indian states — counselling, seat guidance & admission support."
      hubHref="/md-ms"
      hubLabel="Explore MD/MS"
      footerHref="/md-ms"
      footerLabel="View all MD/MS states →"
      onNavigate={onNavigate}
    >
      <div className="nav-mega-mdms-body">
        <aside className="nav-mega-mdms-intro">
          <p>
            Choose your preferred state for MD/MS admission guidance. Our counsellors help with
            eligibility, counselling rounds, and college selection.
          </p>
          <span className="nav-mega-mdms-stat">
            <Stethoscope className="h-3.5 w-3.5" aria-hidden />
            {MD_MS_NAV_ITEMS.length} states
          </span>
        </aside>
        <div className="nav-mega-mdms-grid">
          {MD_MS_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="nav-mega-mdms-card group"
            >
              <span className="nav-mega-mdms-badge">{item.shortLabel}</span>
              <span className="nav-mega-mdms-label">{item.label}</span>
              <ArrowUpRight
                className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-gold-500"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </div>
    </NavMegaMenuShell>
  );
}
