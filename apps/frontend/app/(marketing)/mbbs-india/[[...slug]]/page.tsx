import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContentJsonLd } from '@/components/content/ContentJsonLd';
import { ContentPageShell } from '@/components/content/ContentPageShell';
import { ProgramPageHero } from '@/components/content/ProgramPageHero';
import { RelatedLinksPills } from '@/components/content/RelatedLinksPills';
import { MbbsIndiaIndexHero } from '@/components/mbbs-india/MbbsIndiaIndexHero';
import { MbbsIndiaStateGrid } from '@/components/mbbs-india/MbbsIndiaStateGrid';
import { getContentBySlug } from '@/lib/contentApi';
import { MBBS_INDIA_STATES, getMbbsIndiaStateBySlugPart } from '@/lib/mbbsIndiaTree';
import { plainTitle, metaDescriptionFromContent } from '@/lib/wpHtmlPrepare';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://argroupofeducation.com';

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug?.length) {
    return {
      title: 'MBBS in India — State-wise Medical Colleges',
      description:
        'Explore MBBS colleges across Indian states. Fees, NEET cut-offs, eligibility, and expert admission counselling.',
      alternates: { canonical: `${SITE_URL}/mbbs-india` },
    };
  }

  const state = getMbbsIndiaStateBySlugPart(slug[0]);
  if (!state) return { title: 'MBBS India' };

  const wp = state.wpSlug ? await getContentBySlug(state.wpSlug) : null;
  const title = plainTitle(wp?.metaTitle || wp?.title || `MBBS in ${state.name}`);
  const description =
    wp?.metaDescription ||
    metaDescriptionFromContent(wp?.excerpt, wp?.content || '', 160) ||
    `Explore ${state.colleges.length}+ MBBS colleges in ${state.name}.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}${state.href}` },
    openGraph: { title, description, url: `${SITE_URL}${state.href}` },
  };
}

export default async function MbbsIndiaPage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug?.length) {
    return <MbbsIndiaIndexHero />;
  }

  const state = getMbbsIndiaStateBySlugPart(slug[0]);
  if (!state) notFound();

  const wpContent = state.wpSlug ? await getContentBySlug(state.wpSlug) : null;
  const title = plainTitle(wpContent?.title || `MBBS in ${state.name}`);

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
