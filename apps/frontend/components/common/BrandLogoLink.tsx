'use client';

import type { MouseEvent, ReactNode } from 'react';

type BrandLogoLinkProps = {
  children: ReactNode;
  className?: string;
  frameClassName?: string;
};

/** Logo click → home with full page load (header & footer). */
export function BrandLogoLink({ children, className = '', frameClassName = '' }: BrandLogoLinkProps) {
  const goHomeReload = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.location.href = '/';
  };

  return (
    <a
      href="/"
      onClick={goHomeReload}
      className={['brand-logo-link', className].filter(Boolean).join(' ')}
      aria-label="AR Group of Education — Home"
    >
      <span className={['brand-logo-link__frame', frameClassName].filter(Boolean).join(' ')}>
        {children}
      </span>
    </a>
  );
}
