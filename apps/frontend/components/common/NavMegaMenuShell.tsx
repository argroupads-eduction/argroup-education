'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

export type NavMegaTheme = 'india' | 'abroad' | 'mdms';

type NavMegaMenuShellProps = {
  theme: NavMegaTheme;
  title: string;
  description: string;
  hubHref: string;
  hubLabel: string;
  onNavigate?: () => void;
  children: ReactNode;
  footerHref?: string;
  footerLabel?: string;
  className?: string;
};

export function NavMegaMenuShell({
  theme,
  title,
  description,
  hubHref,
  hubLabel,
  onNavigate,
  children,
  footerHref,
  footerLabel,
  className = '',
}: NavMegaMenuShellProps) {
  return (
    <div className={`nav-mega-shell nav-mega-shell--${theme} ${className}`.trim()}>
      <div className="nav-mega-header">
        <div className="nav-mega-header-glow" aria-hidden />
        <div className="relative min-w-0">
          <p className="nav-mega-header-title">{title}</p>
          <p className="nav-mega-header-desc">{description}</p>
        </div>
        <Link href={hubHref} onClick={onNavigate} className="nav-mega-hub relative">
          {hubLabel}
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      {children}
      {footerHref && footerLabel ? (
        <div className="nav-mega-footer">
          <Link href={footerHref} onClick={onNavigate} className="nav-mega-footer-link">
            {footerLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
