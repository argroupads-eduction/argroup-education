import { Metadata } from 'next';
import { MbbsAbroadHub } from '@/components/program-hub/MbbsAbroadHub';
import { getCuratedPageSeo } from '@/lib/curatedPageSeo';
import { PROGRAM_HUB_SEO } from '@/lib/programHubContent';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const seo = PROGRAM_HUB_SEO.abroad;
  const curated = getCuratedPageSeo(seo.path);
  return {
    title: curated?.metaTitle ?? seo.title,
    description: curated?.metaDescription ?? seo.description,
    keywords: [...seo.keywords],
    alternates: { canonical: seo.path },
  };
}

/** Hub index — native React UI; skip blocking WP export for fast opens. */
export default function MbbsAbroadHubPage() {
  return <MbbsAbroadHub seoContent={null} />;
}
