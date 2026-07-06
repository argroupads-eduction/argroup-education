'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

type BrandLogoLinkProps = {
  children: ReactNode;
  className?: string;
  frameClassName?: string;
};

/** Logo → home via client navigation (avoids full reload layout jump). Modifier-click still opens new tab. */
export function BrandLogoLink({ children, className = '', frameClassName = '' }: BrandLogoLinkProps) {
  return (
    <Link
      href="/"
      className={['brand-logo-link', className].filter(Boolean).join(' ')}
      aria-label="AR Group of Education, Home"
    >
      <span className={['brand-logo-link__frame', frameClassName].filter(Boolean).join(' ')}>
        {children}
      </span>
    </Link>
  );
}
