'use client';

import { useEffect } from 'react';

/** One-open accordion + keyboard-friendly FAQ groups in WP/blog content. */
export function WpFaqEnhancer() {
  useEffect(() => {
    const groups = document.querySelectorAll('.wp-premium-faq-group--animated');
    const cleanups: (() => void)[] = [];

    groups.forEach((group) => {
      const items = Array.from(
        group.querySelectorAll<HTMLDetailsElement>('details.wp-premium-faq')
      );

      items.forEach((detail) => {
        const onToggle = () => {
          if (!detail.open) return;
          items.forEach((other) => {
            if (other !== detail) other.open = false;
          });
        };
        detail.addEventListener('toggle', onToggle);
        cleanups.push(() => detail.removeEventListener('toggle', onToggle));
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
