import { Metadata } from 'next';
import { MbbsIndiaHub } from '@/components/program-hub/MbbsIndiaHub';
import { getContentBySlug } from '@/lib/contentApi';
import { PROGRAM_HUB_SEO, PROGRAM_HUB_WP_SLUG } from '@/lib/programHubContent';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const seo = PROGRAM_HUB_SEO.india;
  const wpContent = await getContentBySlug(PROGRAM_HUB_WP_SLUG.india);
  return {
    title: wpContent?.metaTitle || seo.title,
    description: wpContent?.metaDescription || seo.description,
    keywords: [...seo.keywords],
    alternates: { canonical: seo.path },
  };
}

/** Hub index — explicit route avoids optional catch-all conflicts on Vercel. */
export default async function MbbsIndiaHubPage() {
  const wpContent = await getContentBySlug(PROGRAM_HUB_WP_SLUG.india);
  return <MbbsIndiaHub wpContent={wpContent} />;
}
