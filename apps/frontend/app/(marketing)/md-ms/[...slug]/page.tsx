import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContentJsonLd } from '@/components/content/ContentJsonLd';
import { ContentPageShell } from '@/components/content/ContentPageShell';
import { ProgramPageHero } from '@/components/content/ProgramPageHero';
import { RelatedLinksPills } from '@/components/content/RelatedLinksPills';
import { getContentBySlug } from '@/lib/contentApi';
import { getMdMsNavItemById, MD_MS_NAV_ITEMS } from '@/lib/mdMsNav';
import { getCuratedPageSeo } from '@/lib/curatedPageSeo';
import { plainTitle } from '@/lib/wpHtmlPrepare';

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getMdMsNavItemById(slug[0]);
  if (!item) return { title: 'MD/MS' };

  const curated = getCuratedPageSeo(item.href);
  return {
    title: curated?.metaTitle ?? item.label,
    description:
      curated?.metaDescription ?? `MD/MS admission guidance for ${item.label.replace('MD/MS in ', '')}.`,
    alternates: { canonical: item.href },
  };
}

export default async function MdMsStatePage({ params }: PageProps) {
  const { slug } = await params;
  const item = getMdMsNavItemById(slug[0]);
  if (!item) notFound();

  const wpContent = await getContentBySlug(item.wpSlug);
  const title = plainTitle(wpContent?.title || item.label);
  const breadcrumbs = [
    { label: 'MD / MS', href: '/md-ms' },
    { label: item.label.replace('MD/MS in ', '') },
  ];

  return (
    <>
      {wpContent ? (
        <ContentJsonLd content={{ ...wpContent, slug: item.wpSlug }} breadcrumbs={breadcrumbs} />
      ) : null}

      <ProgramPageHero
        title={title}
        badge="MD / MS"
        theme="mdms"
        breadcrumbs={breadcrumbs}
        subtitle="Postgraduate medical admission · Counselling & seat selection support"
        featuredImage={wpContent?.featuredImage}
      />

      {wpContent ? (
        <ContentPageShell
          html={wpContent.content}
          featuredImage={wpContent.featuredImage}
          title={title}
          showFeaturedImage={false}
          pageSlug={item.wpSlug}
        />
      ) : null}

      <RelatedLinksPills
        title="Explore other states"
        links={MD_MS_NAV_ITEMS.filter((s) => s.id !== item.id).map((s) => ({
          label: s.shortLabel,
          href: s.href,
        }))}
      />
    </>
  );
}
