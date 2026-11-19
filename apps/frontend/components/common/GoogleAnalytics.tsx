'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const GA_ID =
  process.env.NEXT_PUBLIC_GA_ID?.trim() ||
  process.env.NEXT_PUBLIC_GTAG_ID?.trim() ||
  'G-7RW8RDR90K';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Official GA4 snippet via next/script (loads even before React effects).
 * Client page_view covers App Router navigations.
 */
export function GoogleAnalytics() {
  const pathname = usePathname();
  const enabled = Boolean(GA_ID && GA_ID.startsWith('G-'));

  useEffect(() => {
    if (!enabled) return;
    if (typeof window.gtag !== 'function') return;

    const query = window.location.search || '';
    const pagePath = `${pathname || '/'}${query}`;
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, enabled]);

  if (!enabled) return null;

  return (
    <>
      <Script
        id="gtag-js"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
