'use client';

import { useEffect } from 'react';
import { openLeadCapturePopup } from '@/lib/openLeadCapture';

/** Blog CTA lines rendered as buttons open the site enquiry popup. */
export function WpLeadCta() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest('[data-open-lead-capture]');
      if (!button) return;
      event.preventDefault();
      openLeadCapturePopup();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
