import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContentJsonLd } from '@/components/content/ContentJsonLd';
import { ContentPageShell } from '@/components/content/ContentPageShell';
import { ProgramPageHero } from '@/components/content/ProgramPageHero';
import { RelatedLinksPills } from '@/components/content/RelatedLinksPills';
import { MdMsHub } from '@/components/program-hub/MdMsHub';
import { getContentBySlug } from '@/lib/contentApi';
import { getMdMsNavItemById, MD_MS_NAV_ITEMS } from '@/lib/mdMsNav';
import { PROGRAM_HUB_SEO, PROGRAM_HUB_WP_SLUG } from '@/lib/programHubContent';
import { plainTitle, metaDescriptionFromContent } from '@/lib/wpHtmlPrepare';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://argroupofeducation.com';

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!slug?.length) {
    const seo = PROGRAM_HUB_SEO.mdms;
    const wp = await getContentBySlug(PROGRAM_HUB_WP_SLUG.mdms);
    const title = plainTitle(wp?.metaTitle || seo.title);
    const description =
      wp?.metaDescription ||
      metaDescriptionFromContent(wp?.excerpt, wp?.content || '', 160) ||
      seo.description;

    return {
      title,
      description,
      alternates: { canonical: `${SITE_URL}${seo.path}` },
      openGraph: { title, description, url: `${SITE_URL}${seo.path}` },
    };
  }

  const item = getMdMsNavItemById(slug[0]);
  if (!item) return { title: 'MD/MS' };

  const wp = await getContentBySlug(item.wpSlug);
  const title = plainTitle(wp?.metaTitle || wp?.title || item.label);
  const description =
    wp?.metaDescription ||
    metaDescriptionFromContent(wp?.excerpt, wp?.content || '', 160) ||
    `MD/MS admission guidance for ${item.label.replace('MD/MS in ', '')}.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}${item.href}` },
    openGraph: { title, description, url: `${SITE_URL}${item.href}` },
  };
}

export default async function MdMsPage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug?.length) {
    const wpContent = await getContentBySlug(PROGRAM_HUB_WP_SLUG.mdms);
    return <MdMsHub wpContent={wpContent} />;
  }

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
