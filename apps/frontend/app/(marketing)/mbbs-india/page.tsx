import { Metadata } from 'next';
import { MbbsIndiaHub } from '@/components/program-hub/MbbsIndiaHub';
import { getPageContentBySlug } from '@/lib/contentApi';
import { getCuratedPageSeo } from '@/lib/curatedPageSeo';
import { resolveMbbsIndiaFeaturedImage } from '@/lib/mbbsIndiaStateImages';
import { PROGRAM_HUB_SEO, PROGRAM_HUB_WP_SLUG } from '@/lib/programHubContent';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const seo = PROGRAM_HUB_SEO.india;
  const curated = getCuratedPageSeo(seo.path);
  const wp = await getPageContentBySlug(PROGRAM_HUB_WP_SLUG.india);
  const title = curated?.metaTitle ?? wp?.metaTitle ?? seo.title;
  const description = curated?.metaDescription ?? wp?.metaDescription ?? seo.description;
  const image = resolveMbbsIndiaFeaturedImage(PROGRAM_HUB_WP_SLUG.india, wp?.featuredImage ?? wp?.ogImage);
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
      images: image ? [{ url: image, alt: 'MBBS in India' }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function MbbsIndiaHubPage() {
  const wpContent = await getPageContentBySlug(PROGRAM_HUB_WP_SLUG.india);
  return <MbbsIndiaHub wpContent={wpContent} />;
}
