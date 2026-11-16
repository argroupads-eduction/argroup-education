'use client';

import { useEffect } from 'react';

function hide(el: Element | null) {
  if (!el) return;
  const section = el.closest('.elementor-section') ?? el;
  section.classList.add('abroad-hub-wp-hidden');
}

/**
 * Client fallback: hide duplicate WP blocks after hydration.
 */
export function MbbsAbroadWpEnhancer() {
  useEffect(() => {
    const run = () => {
      const root = document.querySelector('.wp-content-abroad-hub');
      if (!root) return;

      root
        .querySelectorAll(
          [
            '.abroad-wp-suppress',
            '.abroad-wp-countries',
            '.abroad-wp-documents',
            '.abroad-wp-countries-heading',
            '.abroad-wp-documents-inner',
            '.abroad-wp-partner-logos',
            '.abroad-wp-duplicate-block',
            '.abroad-wp-doc-orphan',
            '.abroad-wp-admission-grid',
            '.abroad-wp-airport-diaries',
          ].join(', ')
        )
        .forEach((el) => el.classList.add('abroad-hub-wp-hidden'));

      root.querySelectorAll('h1, h2, h3, h4, .elementor-heading-title').forEach((h) => {
        const text = (h.textContent ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (text === 'study mbbs abroad') hide(h);
        if (text.includes('documents required') && text.includes('abroad')) hide(h);
        if (text === 'academic requirements') hide(h);
        if (text === 'admission procedure') hide(h);
        if (text === 'airport diaries') hide(h);
        if (text.includes('x & xii marksheet') && text.length < 24) hide(h);
        if (/partner universities|top mbbs abroad universities/i.test(text)) hide(h);
      });

      root.querySelectorAll('.elementor-column').forEach((col) => {
        const link = col.querySelector('a');
        const img = col.querySelector('img');
        const label = (link?.textContent ?? '').toUpperCase();
        if (img && label.includes('MBBS IN')) {
          const section = col.closest('.elementor-top-section');
          if (section) section.classList.add('abroad-hub-wp-hidden');
        }
      });
    };

    run();
    const t = window.setTimeout(run, 120);
    const t2 = window.setTimeout(run, 600);

    const observer = new MutationObserver(run);
    const root = document.querySelector('.abroad-guide-shell');
    if (root) observer.observe(root, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
      observer.disconnect();
    };
  }, []);

  return null;
}
