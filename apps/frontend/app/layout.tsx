import type { Metadata, Viewport } from 'next';
import { Inter, Lora, Poppins } from 'next/font/google';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { LeadCapturePopup } from '@/components/common/LeadCapturePopup';
import { NeetRankPredictorPromoStrip } from '@/components/neet-rank-predictor/NeetRankPredictorPromoStrip';
import '@/styles/neet-rank-predictor.css';
import { NavPagesProvider } from '@/components/common/NavPagesProvider';
import { SiteGlobalsProvider } from '@/components/common/SiteGlobalsProvider';
import { fetchDynamicNavPages } from '@/lib/dynamicNav';
import { fetchSiteGlobalsBundle } from '@/lib/siteGlobals';
import '@/styles/globals.css';
import '@/styles/wp-content.css';
import '@/styles/blog.css';
import '@/styles/nav-mega.css';
import '@/styles/navbar-premium.css';
import '@/styles/program-hub.css';
import '@/styles/mbbs-abroad-premium.css';
import '@/styles/brand-logo.css';
import { getSiteUrl } from '@/lib/siteUrl';

// Font imports
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

/** Serif headings — Lora uses a standard “&” (Playfair’s default & has decorative swashes). */
const playfair = Lora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700'],
});

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'AR Group of Education | Medical Education Consultancy',
    template: '%s | AR Group of Education',
  },
  description:
    'Premium educational consultancy for MBBS abroad. Expert guidance, 4000+ successful students, 500+ universities, 98% visa success rate.',
  keywords: [
    'MBBS abroad',
    'medical education',
    'study abroad',
    'NEET guidance',
    'university admission',
  ],
  authors: [{ name: 'AR Group of Education' }],
  creator: 'AR Group of Education',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: getSiteUrl(),
    siteName: 'AR Group of Education',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navPages = await fetchDynamicNavPages();
  const siteGlobals = await fetchSiteGlobalsBundle();

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${poppins.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#1a365d" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${inter.className} min-h-dvh min-w-0 overflow-x-hidden [padding-bottom:env(safe-area-inset-bottom,0px)] [padding-left:env(safe-area-inset-left,0px)] [padding-right:env(safe-area-inset-right,0px)]`}
      >
        <SiteGlobalsProvider globals={siteGlobals}>
          <NavPagesProvider pages={navPages}>
            <NeetRankPredictorPromoStrip />
            <Navbar />
            <main className="min-w-0">{children}</main>
            <Footer />
            <LeadCapturePopup />
          </NavPagesProvider>
        </SiteGlobalsProvider>
      </body>
    </html>
  );
}
