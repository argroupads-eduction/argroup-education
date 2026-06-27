import { Metadata } from 'next';
import { MdMsHub } from '@/components/program-hub/MdMsHub';
import { getCuratedPageSeo } from '@/lib/curatedPageSeo';
import { PROGRAM_HUB_SEO } from '@/lib/programHubContent';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const seo = PROGRAM_HUB_SEO.mdms;
  const curated = getCuratedPageSeo(seo.path);
  return {
    title: curated?.metaTitle ?? seo.title,
    description: curated?.metaDescription ?? seo.description,
    keywords: [...seo.keywords],
    alternates: { canonical: seo.path },
  };
}

/** Hub index — explicit route avoids optional catch-all conflicts on Vercel. */
export default function MdMsHubPage() {
  return <MdMsHub wpContent={null} />;
}
