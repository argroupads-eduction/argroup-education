import { Metadata } from 'next';
import { MbbsAbroadHub } from '@/components/program-hub/MbbsAbroadHub';
import { getWpExportContentBySlug } from '@/lib/wpExportContent';
import { buildSiteMetadata } from '@/lib/buildSiteMetadata';
import { getCuratedPageSeo } from '@/lib/curatedPageSeo';
import { applyMarketingPageSeo } from '@/lib/marketingPageSeo';
import { PROGRAM_HUB_SEO, PROGRAM_HUB_WP_SLUG } from '@/lib/programHubContent';

export const revalidate = 300;

async function getAbroadHubSeoContent() {
  const bundled = await getWpExportContentBySlug(PROGRAM_HUB_WP_SLUG.abroad);
  if (!bundled) return null;
  // Hub body is native React — keep Yoast/JSON-LD fields only (skip heavy WP HTML).
  return { ...bundled, content: '' };
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = PROGRAM_HUB_SEO.abroad;
  const curated = getCuratedPageSeo(seo.path);
  const wpContent = await getAbroadHubSeoContent();
  if (wpContent) {
    return buildSiteMetadata(applyMarketingPageSeo(wpContent), {
      canonicalPath: seo.path,
      fallbackTitle: curated?.metaTitle ?? seo.title,
    });
  }
  return {
    title: curated?.metaTitle ?? seo.title,
    description: curated?.metaDescription ?? seo.description,
    keywords: [...seo.keywords],
    alternates: { canonical: seo.path },
  };
}

/** Hub index — explicit route avoids optional catch-all / [slug] redirect conflicts. */
export default async function MbbsAbroadHubPage() {
  const seoContent = await getAbroadHubSeoContent();
  return <MbbsAbroadHub seoContent={seoContent} />;
}