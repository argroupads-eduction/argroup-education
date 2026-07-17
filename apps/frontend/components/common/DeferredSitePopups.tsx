'use client';

import dynamic from 'next/dynamic';

const LeadCapturePopup = dynamic(
  () =>
    import('@/components/common/LeadCapturePopup').then((m) => ({
      default: m.LeadCapturePopup,
    })),
  { ssr: false }
);

/** Load the site-wide enquiry popup on the client. */
export function DeferredSitePopups() {
  return <LeadCapturePopup />;
}
