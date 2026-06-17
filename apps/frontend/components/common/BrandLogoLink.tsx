'use client';

import Link from 'next/link';
import type { MouseEvent, ReactNode } from 'react';

type BrandLogoLinkProps = {
  children: ReactNode;
  className?: string;
  frameClassName?: string;
};

/** Logo click → home with full page load (header & footer). Modifier/middle-click opens a new tab. */
export function BrandLogoLink({ children, className = '', frameClassName = '' }: BrandLogoLinkProps) {
  const goHomeReload = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    window.location.href = '/';
  };

  return (
    <Link
      href="/"
      onClick={goHomeReload}
      className={['brand-logo-link', className].filter(Boolean).join(' ')}
      aria-label="AR Group of Education, Home"
    >
      <span className={['brand-logo-link__frame', frameClassName].filter(Boolean).join(' ')}>
        {children}
      </span>
    </Link>
  );
}
