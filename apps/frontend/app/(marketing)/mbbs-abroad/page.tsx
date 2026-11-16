import { Metadata } from 'next';
import { MbbsAbroadHub } from '@/components/program-hub/MbbsAbroadHub';
import { getPageContentBySlug } from '@/lib/contentApi';
import { getCuratedPageSeo } from '@/lib/curatedPageSeo';
import { resolveMbbsAbroadFeaturedImage } from '@/lib/mbbsAbroadCountryImages';
import { PROGRAM_HUB_SEO, PROGRAM_HUB_WP_SLUG } from '@/lib/programHubContent';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const seo = PROGRAM_HUB_SEO.abroad;
  const curated = getCuratedPageSeo(seo.path);
  const wp = await getPageContentBySlug(PROGRAM_HUB_WP_SLUG.abroad);
  const title = curated?.metaTitle ?? wp?.metaTitle ?? seo.title;
  const description = curated?.metaDescription ?? wp?.metaDescription ?? seo.description;
  const image = resolveMbbsAbroadFeaturedImage(PROGRAM_HUB_WP_SLUG.abroad, wp?.featuredImage ?? wp?.ogImage);
  return {
    title,
    description,
    keywords: [...seo.keywords],
    alternates: { canonical: seo.path },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
    openGraph: {
      title,
      description,
      url: seo.path,
      type: 'website',
      images: image ? [{ url: image, alt: 'MBBS Abroad' }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function MbbsAbroadHubPage() {
  const seoContent = await getPageContentBySlug(PROGRAM_HUB_WP_SLUG.abroad);
  return <MbbsAbroadHub seoContent={seoContent} />;
}
