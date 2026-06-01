import { Metadata } from 'next';
import { AboutPageView } from '@/components/about/AboutPageView';
import { ContentJsonLd } from '@/components/content/ContentJsonLd';
import { ABOUT_SEO, ABOUT_WP_SLUG } from '@/lib/aboutContent';
import { getContentBySlug, type SiteContent } from '@/lib/contentApi';
import { buildSiteMetadata } from '@/lib/buildSiteMetadata';
import { plainTitle } from '@/lib/wpHtmlPrepare';

export async function generateMetadata(): Promise<Metadata> {
  const wp = await getContentBySlug(ABOUT_WP_SLUG);
  if (wp) {
    return buildSiteMetadata(wp, {
      canonicalPath: '/about',
      fallbackTitle: ABOUT_SEO.title,
    });
  }

  return {
    title: ABOUT_SEO.title,
    description: ABOUT_SEO.description,
    alternates: { canonical: '/about' },
  };
}

export default async function AboutPage() {
  const wpContent = await getContentBySlug(ABOUT_WP_SLUG);
  const title = plainTitle(wpContent?.title || 'About AR Group of Education');

  const jsonLdContent: SiteContent =
    wpContent ??
    ({
      id: 'about-ar-group',
      type: 'page',
      title,
      slug: ABOUT_WP_SLUG,
      content: '',
      excerpt: ABOUT_SEO.description,
      featuredImage: '/about-counsellor.png',
      metaTitle: ABOUT_SEO.title,
      metaDescription: ABOUT_SEO.description,
      canonicalUrl: null,
      publishedAt: null,
      updatedAt: new Date().toISOString(),
    } satisfies SiteContent);

  return (
    <>
      <ContentJsonLd content={jsonLdContent} breadcrumbs={[{ label: 'About Us' }]} />
      <AboutPageView />
    </>
  );
}
