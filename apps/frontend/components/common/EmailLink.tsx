'use client';

import { useEffect, useState, type ReactNode } from 'react';

type EmailLinkProps = {
  email: string;
  className?: string;
  children?: ReactNode;
};

/**
 * Cloudflare Email Address Obfuscation injects email-decode.min.js when it
 * sees a raw mailto / address in first HTML. Hydrate the real address after paint.
 */
export function EmailLink({ email, className, children }: EmailLinkProps) {
  const [href, setHref] = useState<string | undefined>(undefined);
  const [label, setLabel] = useState('Email');

  useEffect(() => {
    setHref(`mailto:${email}`);
    setLabel(email);
  }, [email]);

  return (
    <a href={href} className={className}>
      {children}
      {label}
    </a>
  );
}
