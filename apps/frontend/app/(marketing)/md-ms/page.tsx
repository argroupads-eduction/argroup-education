import { Metadata } from 'next';
import { MdMsHub } from '@/components/program-hub/MdMsHub';
import { getContentBySlug } from '@/lib/contentApi';
import { getCuratedPageSeo } from '@/lib/curatedPageSeo';
import { PROGRAM_HUB_SEO, PROGRAM_HUB_WP_SLUG } from '@/lib/programHubContent';

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
export default async function MdMsHubPage() {
  const wpContent = await getContentBySlug(PROGRAM_HUB_WP_SLUG.mdms);
  return <MdMsHub wpContent={wpContent} />;
}
