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
import { buildSiteMetadata } from '@/lib/buildSiteMetadata';
import { plainTitle } from '@/lib/wpHtmlPrepare';

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug?.length) {
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

  const country = getMbbsAbroadCountryById(slug[0]);
  if (!country) return { title: 'MBBS Abroad' };

  const wp = country.wpSlug ? await getContentBySlug(country.wpSlug) : null;
  if (wp) {
    return buildSiteMetadata(wp, {
      canonicalPath: country.href,
      fallbackTitle: `MBBS in ${country.name}`,
    });
  }

  return {
    title: `MBBS in ${country.name}`,
    description: `Explore MBBS universities in ${country.name}.`,
    alternates: { canonical: country.href },
  };
}

export default async function MbbsAbroadPage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug?.length) {
    const seoContent = await getContentBySlug(PROGRAM_HUB_WP_SLUG.abroad);
    return <MbbsAbroadHub seoContent={seoContent} />;
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
