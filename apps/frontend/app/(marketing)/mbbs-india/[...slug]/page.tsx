import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContentJsonLd } from '@/components/content/ContentJsonLd';
import { ContentPageShell } from '@/components/content/ContentPageShell';
import { ProgramPageHero } from '@/components/content/ProgramPageHero';
import { RelatedLinksPills } from '@/components/content/RelatedLinksPills';
import { MbbsIndiaStateGrid } from '@/components/mbbs-india/MbbsIndiaStateGrid';
import { getPageContentBySlug } from '@/lib/contentApi';
import { MBBS_INDIA_STATES, getMbbsIndiaStateBySlugPart } from '@/lib/mbbsIndiaTree';
import { getCuratedPageSeo } from '@/lib/curatedPageSeo';
import { resolveMbbsIndiaFeaturedImage } from '@/lib/mbbsIndiaStateImages';
import { plainTitle } from '@/lib/wpHtmlPrepare';

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const state = getMbbsIndiaStateBySlugPart(slug[0]);
  if (!state) return { title: 'MBBS India' };

  const curated = getCuratedPageSeo(state.href);
  const title = curated?.metaTitle ?? `MBBS in ${state.name}`;
  const description =
    curated?.metaDescription ?? `Explore ${state.colleges.length}+ MBBS colleges in ${state.name}.`;
  const ogImage =
    resolveMbbsIndiaFeaturedImage(state.wpSlug, null, state.colleges[0]?.image) ??
    '/ar-group-logo.png';

  return {
    title,
    description,
    alternates: { canonical: state.href },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
    openGraph: {
      title,
      description,
      url: state.href,
      type: 'website',
      images: [{ url: ogImage, alt: `MBBS colleges in ${state.name}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function MbbsIndiaStatePage({ params }: PageProps) {
  const { slug } = await params;
  const state = getMbbsIndiaStateBySlugPart(slug[0]);
  if (!state) notFound();

  const wpContent = state.wpSlug ? await getPageContentBySlug(state.wpSlug) : null;
  const title = plainTitle(wpContent?.title || `MBBS in ${state.name}`);
  const collegeHero = state.colleges.find((college) => college.image)?.image ?? null;
  const featuredImage = resolveMbbsIndiaFeaturedImage(
    state.wpSlug,
    wpContent?.featuredImage,
    collegeHero
  );
  const pageHtml = wpContent?.content ?? null;

  const breadcrumbs = [
    { label: 'MBBS India', href: '/mbbs-india' },
    { label: state.name },
  ];

  return (
    <>
      {wpContent ? <ContentJsonLd content={{ ...wpContent, slug: state.wpSlug! }} breadcrumbs={breadcrumbs} /> : null}

      <ProgramPageHero
        title={title}
        badge="MBBS in India"
        theme="india"
        breadcrumbs={breadcrumbs}
        subtitle={`${state.colleges.length} medical colleges · Expert NEET counselling & admission support`}
        stats={[
          { label: 'Colleges listed', value: String(state.colleges.length) },
          { label: 'Region', value: state.name },
        ]}
        featuredImage={featuredImage}
        heroImageFit="state"
      />

      {wpContent && pageHtml ? (
        <ContentPageShell
          html={pageHtml}
          featuredImage={featuredImage}
          title={title}
          showFeaturedImage={false}
          pageSlug={state.wpSlug}
          articleClassName="wp-content-mbbs-india"
        />
      ) : null}

      <section className="bg-slate-50/50 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <MbbsIndiaStateGrid state={state} />
        </div>
      </section>

      <RelatedLinksPills
        title="Explore other states"
        links={MBBS_INDIA_STATES.filter((s) => s.id !== state.id).map((s) => ({
          label: s.name,
          href: s.href,
        }))}
      />
    </>
  );
}
