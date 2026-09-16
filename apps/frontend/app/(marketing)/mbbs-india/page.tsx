import { Metadata } from 'next';
import { MbbsIndiaHub } from '@/components/program-hub/MbbsIndiaHub';
import { getCuratedPageSeo } from '@/lib/curatedPageSeo';
import { PROGRAM_HUB_SEO } from '@/lib/programHubContent';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const seo = PROGRAM_HUB_SEO.india;
  const curated = getCuratedPageSeo(seo.path);
  return {
    title: curated?.metaTitle ?? seo.title,
    description: curated?.metaDescription ?? seo.description,
    keywords: [...seo.keywords],
    alternates: { canonical: seo.path },
  };
}

/** Hub index — native React UI; skip blocking CMS/WP body for fast opens. */
export default function MbbsIndiaHubPage() {
  return <MbbsIndiaHub wpContent={null} />;
}
