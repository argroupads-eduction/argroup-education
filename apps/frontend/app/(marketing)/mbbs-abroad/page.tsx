import { Metadata } from 'next';
import { MbbsAbroadHub } from '@/components/program-hub/MbbsAbroadHub';
import { PROGRAM_HUB_SEO, PROGRAM_HUB_WP_SLUG } from '@/lib/programHubContent';
import { getContentBySlug } from '@/lib/contentApi';
import { buildSiteMetadata } from '@/lib/buildSiteMetadata';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const seo = PROGRAM_HUB_SEO.abroad;
  const wp = await getContentBySlug(PROGRAM_HUB_WP_SLUG.abroad);
  if (wp) {
    return buildSiteMetadata(wp, {
      canonicalPath: seo.path,
      fallbackTitle: seo.title,
    });
  }
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.path },
  };
}

/** Hub index — explicit route avoids optional catch-all / [slug] redirect conflicts. */
export default async function MbbsAbroadHubPage() {
  const seoContent = await getContentBySlug(PROGRAM_HUB_WP_SLUG.abroad);
  return <MbbsAbroadHub seoContent={seoContent} />;
}
