import { Metadata } from 'next';
import { AboutPageView } from '@/components/about/AboutPageView';
import { ContentJsonLd } from '@/components/content/ContentJsonLd';
import { ABOUT_SEO, ABOUT_WP_SLUG } from '@/lib/aboutContent';
import { getContentBySlug, type SiteContent } from '@/lib/contentApi';
import { plainTitle, metaDescriptionFromContent } from '@/lib/wpHtmlPrepare';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://argroupofeducation.com';

export async function generateMetadata(): Promise<Metadata> {
  const wp = await getContentBySlug(ABOUT_WP_SLUG);
  const title = plainTitle(wp?.metaTitle || ABOUT_SEO.title);
  const description =
    wp?.metaDescription ||
    metaDescriptionFromContent(wp?.excerpt, wp?.content || '', 160) ||
    ABOUT_SEO.description;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/about` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/about`,
      type: 'website',
    },
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
