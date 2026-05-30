'use client';

import { useEffect } from 'react';

/** Fade-in sections on scroll — text stays readable; animation is progressive enhancement. */
export function WpLazyReveal() {
  useEffect(() => {
    const root = document.querySelector('.wp-content-affinity');
    if (!root) return;

    const sections = root.querySelectorAll('.wp-lazy-section');
    if (!sections.length) return;

    const reveal = (el: Element) => el.classList.add('is-visible');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.05 }
    );

    sections.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95) {
        reveal(el);
      } else {
        root.classList.add('js-lazy-enabled');
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
