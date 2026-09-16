'use client';

import { useEffect } from 'react';

const GA_ID =
  process.env.NEXT_PUBLIC_GA_ID?.trim() ||
  process.env.NEXT_PUBLIC_GTAG_ID?.trim() ||
  'G-7RW8RDR90K';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * Load GA4 after first paint / idle so gtag does not compete with LCP/INP.
 */
export function GoogleAnalytics() {
  useEffect(() => {
    if (!GA_ID || !GA_ID.startsWith('G-')) return undefined;

    let cancelled = false;
    let idleId: number | undefined;
    let timerId: number | undefined;

    const load = () => {
      if (cancelled || document.getElementById('gtag-js')) return;

      window.dataLayer = window.dataLayer || [];
      const gtag = (...args: unknown[]) => {
        window.dataLayer?.push(args);
      };
      gtag('js', new Date());
      gtag('config', GA_ID);

      const script = document.createElement('script');
      script.id = 'gtag-js';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(script);
    };

    const onInteract = () => {
      load();
      cleanupInteract();
    };

    const cleanupInteract = () => {
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
      window.removeEventListener('scroll', onInteract, true);
    };

    window.addEventListener('pointerdown', onInteract, { once: true, passive: true });
    window.addEventListener('keydown', onInteract, { once: true });
    window.addEventListener('scroll', onInteract, { once: true, passive: true, capture: true });

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(load, { timeout: 4000 });
    } else {
      timerId = window.setTimeout(load, 2500);
    }

    return () => {
      cancelled = true;
      cleanupInteract();
      if (idleId != null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (timerId != null) window.clearTimeout(timerId);
    };
  }, []);

  return null;
}
