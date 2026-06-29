import type { Metadata, Viewport } from 'next';
import { Inter, Lora, Poppins } from 'next/font/google';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { LeadCapturePopup } from '@/components/common/LeadCapturePopup';
import { LeadSubmissionFeedbackHost } from '@/components/common/LeadSubmissionFeedbackHost';
import { NeetRankPredictorPromoStrip } from '@/components/neet-rank-predictor/NeetRankPredictorPromoStrip';
import '@/styles/neet-rank-predictor.css';
import { NavPagesProvider } from '@/components/common/NavPagesProvider';
import { SiteGlobalsProvider } from '@/components/common/SiteGlobalsProvider';
import { fetchDynamicNavPages } from '@/lib/dynamicNav.server';
import {
  EMPTY_SITE_GLOBALS,
  fetchSiteGlobalsBundle,
} from '@/lib/siteGlobals.server';
import '@/styles/globals.css';
import '@/styles/wp-content.css';
import '@/styles/blog.css';
import '@/styles/nav-mega.css';
import '@/styles/nav-latest-updates.css';
import '@/styles/navbar-premium.css';
import '@/styles/program-hub.css';
import '@/styles/mbbs-abroad-premium.css';
import '@/styles/mbbs-abroad-hub-guide.css';
import '@/styles/brand-logo.css';
import '@/styles/footer-main.css';
import { getSiteUrl } from '@/lib/siteUrl';

// Font imports
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

/** Serif headings, Lora uses a standard “&” (Playfair’s default & has decorative swashes). */
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
    default: 'AR Group of Education | MBBS India & Abroad Admission Consultant',
    template: '%s | AR Group of Education',
  },
  description:
    'Trusted medical education consultants for MBBS in India & abroad, NEET UG/PG counselling, college shortlisting & visa support. 4000+ students guided since 2010.',
  keywords: [
    'MBBS admission consultant',
    'MBBS in India',
    'MBBS abroad',
    'NEET counselling',
    'medical education consultancy Delhi NCR',
    'NEET rank predictor',
    'study MBBS abroad',
    'AR Group of Education',
  ],
  authors: [{ name: 'AR Group of Education' }],
  creator: 'AR Group of Education',
  icons: {
    icon: [{ url: '/ar-browser-icon.png', type: 'image/png' }],
    shortcut: ['/ar-browser-icon.png'],
    apple: [{ url: '/ar-browser-icon.png', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: getSiteUrl(),
    siteName: 'AR Group of Education',
    title: 'AR Group of Education | MBBS India & Abroad Admission Consultant',
    description:
      'Expert MBBS admission guidance for India & 15+ countries. NEET counselling, college selection & visa support. 4000+ students placed.',
    images: [{ url: '/ar-group-logo.png', width: 512, height: 512, alt: 'AR Group of Education logo' }],
  },
  twitter: {
    card: 'summary',
    title: 'AR Group of Education | MBBS Admission Consultant',
    description:
      'MBBS India & abroad admission experts. NEET counselling, college shortlisting & visa guidance.',
    images: ['/ar-group-logo.png'],
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
  const [navPages, siteGlobals] = await Promise.all([
    fetchDynamicNavPages().catch(() => []),
    fetchSiteGlobalsBundle().catch(() => EMPTY_SITE_GLOBALS),
  ]);

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${poppins.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#1a365d" />
        <link rel="icon" href="/ar-browser-icon.png" type="image/png" />
        <link rel="shortcut icon" href="/ar-browser-icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/ar-browser-icon.png" />
        <link rel="preload" href="/ar-group-logo.png" as="image" type="image/png" />
        <link rel="preload" href="/india-homepage.jpg" as="image" type="image/jpeg" />
        <link rel="preload" href="/abroad-homepage.jpg" as="image" type="image/jpeg" />
        <link rel="dns-prefetch" href="https://argroupofeducation.com" />
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
            <LeadSubmissionFeedbackHost />
          </NavPagesProvider>
        </SiteGlobalsProvider>
      </body>
    </html>
  );
}
