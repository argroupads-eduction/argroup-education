const GA_ID =
  process.env.NEXT_PUBLIC_GA_ID?.trim() ||
  process.env.NEXT_PUBLIC_GTAG_ID?.trim() ||
  'G-7RW8RDR90K';

/**
 * GA4 gtag via native script tags (avoids next/script webpack "reading 'call'" crash).
 */
export function GoogleAnalytics() {
  if (!GA_ID || !GA_ID.startsWith('G-')) return null;

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
      <script
        id="google-analytics"
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');
          `.trim(),
        }}
      />
    </>
  );
}
