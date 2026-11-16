import { Metadata } from 'next';
import { AboutPageView } from '@/components/about/AboutPageView';
import { ContentJsonLd } from '@/components/content/ContentJsonLd';
import { ABOUT_SEO, ABOUT_WP_SLUG } from '@/lib/aboutContent';
import type { SiteContent } from '@/lib/contentApi';

export const revalidate = 300;

export const metadata: Metadata = {
  title: ABOUT_SEO.title,
  description: ABOUT_SEO.description,
  keywords: [...ABOUT_SEO.keywords],
  alternates: { canonical: '/about' },
  openGraph: {
    title: ABOUT_SEO.title,
    description: ABOUT_SEO.description,
    url: '/about',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: ABOUT_SEO.title,
    description: ABOUT_SEO.description,
  },
};

export default function AboutPage() {
  const jsonLdContent = {
    id: 'about-ar-group',
    type: 'page',
    title: 'About AR Group of Education',
    slug: ABOUT_WP_SLUG,
    content: '',
    excerpt: ABOUT_SEO.description,
    featuredImage: '/about-counsellor.png',
    metaTitle: ABOUT_SEO.title,
    metaDescription: ABOUT_SEO.description,
    canonicalUrl: null,
    publishedAt: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
  } satisfies SiteContent;

  return (
    <>
      <ContentJsonLd content={jsonLdContent} breadcrumbs={[{ label: 'About Us' }]} />
      <AboutPageView />
    </>
  );
}
