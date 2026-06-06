'use client';

import { useEffect } from 'react';

/** Mark lazy sections visible — content must never stay hidden (avoids empty white gaps). */
export function WpLazyReveal() {
  useEffect(() => {
    const root = document.querySelector('.wp-content-affinity');
    if (!root) return;

    const sections = root.querySelectorAll('.wp-lazy-section');
    sections.forEach((el) => el.classList.add('is-visible'));
  }, []);

  return null;
}
