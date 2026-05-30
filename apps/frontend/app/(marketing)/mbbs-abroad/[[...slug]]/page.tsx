import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContentJsonLd } from '@/components/content/ContentJsonLd';
import { ContentPageShell } from '@/components/content/ContentPageShell';
import { ProgramPageHero } from '@/components/content/ProgramPageHero';
import { RelatedLinksPills } from '@/components/content/RelatedLinksPills';
import { MbbsAbroadCountryGrid } from '@/components/mbbs-abroad/MbbsAbroadCountryGrid';
import { MbbsAbroadHub } from '@/components/program-hub/MbbsAbroadHub';
import { PROGRAM_HUB_SEO, PROGRAM_HUB_WP_SLUG } from '@/lib/programHubContent';
import { getContentBySlug } from '@/lib/contentApi';
import {
  MBBS_ABROAD_COUNTRIES,
  getMbbsAbroadCountryById,
  isMbbsAbroadThreeLevel,
  mbbsAbroadCountryCollegeCount,
} from '@/lib/mbbsAbroadTree';
import { plainTitle, metaDescriptionFromContent } from '@/lib/wpHtmlPrepare';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://argroupofeducation.com';

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug?.length) {
    const seo = PROGRAM_HUB_SEO.abroad;
    const wp = await getContentBySlug(PROGRAM_HUB_WP_SLUG.abroad);
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

  const country = getMbbsAbroadCountryById(slug[0]);
  if (!country) return { title: 'MBBS Abroad' };

  const wp = country.wpSlug ? await getContentBySlug(country.wpSlug) : null;
  const title = plainTitle(wp?.metaTitle || wp?.title || `MBBS in ${country.name}`);
  const description =
    wp?.metaDescription ||
    metaDescriptionFromContent(wp?.excerpt, wp?.content || '', 160) ||
    `Explore MBBS universities in ${country.name}.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}${country.href}` },
    openGraph: { title, description, url: `${SITE_URL}${country.href}` },
  };
}

export default async function MbbsAbroadPage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug?.length) {
    const wpContent = await getContentBySlug(PROGRAM_HUB_WP_SLUG.abroad);
    return <MbbsAbroadHub wpContent={wpContent} />;
  }

  const country = getMbbsAbroadCountryById(slug[0]);
  if (!country) notFound();

  if (slug.length >= 2 && isMbbsAbroadThreeLevel(country)) {
    const university = country.universities?.find((u) => u.id === slug[1]);
    if (!university) notFound();

    const wpContent = university.slug ? await getContentBySlug(university.slug) : null;
    const title = plainTitle(wpContent?.title || university.name);
    const breadcrumbs = [
      { label: 'MBBS Abroad', href: '/mbbs-abroad' },
      { label: country.name, href: country.href },
      { label: university.name },
    ];

    return (
      <>
        {wpContent ? (
          <ContentJsonLd content={{ ...wpContent, slug: university.slug! }} breadcrumbs={breadcrumbs} />
        ) : null}

        <ProgramPageHero
          title={title}
          badge="MBBS Abroad"
          theme="abroad"
          breadcrumbs={breadcrumbs}
          subtitle={`Universities in ${country.name} · NMC-aligned guidance`}
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

        {university.colleges?.length ? (
          <section className="bg-slate-50/50 py-12 md:py-16">
            <div className="mx-auto max-w-7xl px-4">
              <MbbsAbroadCountryGrid
                country={{ ...country, colleges: university.colleges, universities: undefined }}
              />
            </div>
          </section>
        ) : null}
      </>
    );
  }

  const wpContent = country.wpSlug ? await getContentBySlug(country.wpSlug) : null;
  const title = plainTitle(wpContent?.title || `MBBS in ${country.name}`);
  const collegeCount = mbbsAbroadCountryCollegeCount(country);
  const breadcrumbs = [
    { label: 'MBBS Abroad', href: '/mbbs-abroad' },
    { label: country.name },
  ];

  return (
    <>
      {wpContent ? <ContentJsonLd content={{ ...wpContent, slug: country.wpSlug! }} breadcrumbs={breadcrumbs} /> : null}

      <ProgramPageHero
        title={title}
        badge="MBBS Abroad"
        theme="abroad"
        breadcrumbs={breadcrumbs}
        subtitle="WHO-listed universities · Fees, eligibility & visa support"
        stats={
          collegeCount > 0
            ? [
                { label: 'Universities', value: String(collegeCount) },
                { label: 'Destination', value: country.name },
              ]
            : undefined
        }
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

      <section className="bg-slate-50/50 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <MbbsAbroadCountryGrid country={country} />
        </div>
      </section>

      <RelatedLinksPills
        title="Explore other countries"
        links={MBBS_ABROAD_COUNTRIES.filter((c) => c.id !== country.id).map((c) => ({
          label: c.name,
          href: c.href,
        }))}
      />
    </>
  );
}
