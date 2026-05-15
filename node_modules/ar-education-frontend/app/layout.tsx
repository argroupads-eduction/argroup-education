import type { Metadata } from 'next';
import { Inter, Playfair_Display, Poppins } from 'next/font/google';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { LeadCapturePopup } from '@/components/common/LeadCapturePopup';
import '@/styles/globals.css';

// Font imports
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://argroup.edu'),
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
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://argroup.edu',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${poppins.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1a365d" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <LeadCapturePopup />
      </body>
    </html>
  );
}
