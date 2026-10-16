import { Metadata } from 'next';
import { MdMsHub } from '@/components/program-hub/MdMsHub';
import { getPageContentBySlug } from '@/lib/contentApi';
import { getCuratedPageSeo } from '@/lib/curatedPageSeo';
import { PROGRAM_HUB_SEO, PROGRAM_HUB_WP_SLUG } from '@/lib/programHubContent';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const seo = PROGRAM_HUB_SEO.mdms;
  const curated = getCuratedPageSeo(seo.path);
  const wp = await getPageContentBySlug(PROGRAM_HUB_WP_SLUG.mdms);
  const title = curated?.metaTitle ?? wp?.metaTitle ?? seo.title;
  const description = curated?.metaDescription ?? wp?.metaDescription ?? seo.description;
  const ogDescription =
    'Get guidance on MD MS admission in India: NEET PG counselling, college options, fees and documents.';
  const image = wp?.ogImage || wp?.featuredImage || '/images/md-ms/up.jpeg';
  return {
    title: { absolute: title },
    description,
    keywords: [...seo.keywords],
    alternates: { canonical: seo.path },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
    openGraph: {
      title,
      description: ogDescription,
      url: seo.path,
      type: 'website',
      images: [{ url: image, alt: 'MD/MS admission in India' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: ogDescription,
      images: [image],
    },
  };
}

/** Hub index — explicit route avoids optional catch-all conflicts on Vercel. */
export default async function MdMsHubPage() {
  const wpContent = await getPageContentBySlug(PROGRAM_HUB_WP_SLUG.mdms);
  return <MdMsHub wpContent={wpContent} />;
}
