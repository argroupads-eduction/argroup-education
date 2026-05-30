import { ContentJsonLd } from '@/components/content/ContentJsonLd';
import { ContentPageShell } from '@/components/content/ContentPageShell';
import { MbbsIndiaHubExplorer } from '@/components/program-hub/MbbsIndiaHubExplorer';
import { ProgramHubCta } from '@/components/program-hub/ProgramHubCta';
import { ProgramHubHero } from '@/components/program-hub/ProgramHubHero';
import { ProgramHubTrustBar } from '@/components/program-hub/ProgramHubTrustBar';
import type { SiteContent } from '@/lib/contentApi';
import { MBBS_INDIA_STATES, collegeCount } from '@/lib/mbbsIndiaTree';
import { PROGRAM_HUB_SEO } from '@/lib/programHubContent';
import { plainTitle } from '@/lib/wpHtmlPrepare';

type MbbsIndiaHubProps = {
  wpContent: SiteContent | null;
};

export function MbbsIndiaHub({ wpContent }: MbbsIndiaHubProps) {
  const seo = PROGRAM_HUB_SEO.india;
  const title = plainTitle(wpContent?.title || 'MBBS in India');
  const breadcrumbs = [{ label: 'MBBS India' }];

  const contentForJsonLd: SiteContent =
    wpContent ??
    ({
      id: 'mbbs-india-hub',
      type: 'page',
      title,
      slug: 'mbbs-in-india',
      content: '',
      excerpt: seo.description,
      featuredImage: null,
      metaTitle: seo.title,
      metaDescription: seo.description,
      canonicalUrl: null,
      publishedAt: null,
      updatedAt: new Date().toISOString(),
    } satisfies SiteContent);

  return (
    <div className="program-hub-root">
      <ContentJsonLd content={contentForJsonLd} breadcrumbs={breadcrumbs} />

      <ProgramHubHero
        theme="india"
        badge={seo.badge}
        breadcrumbs={breadcrumbs}
        title={
          <>
            State-wise guide to{' '}
            <span className="program-hub-title-accent">MBBS in India</span>
          </>
        }
        lead={seo.description}
        stats={[
          { label: 'States', value: String(MBBS_INDIA_STATES.length) },
          { label: 'Colleges', value: `${collegeCount()}+` },
          { label: 'Counselling', value: 'Free' },
        ]}
      />

      <ProgramHubTrustBar />
      <MbbsIndiaHubExplorer />

      {wpContent?.content ? (
        <section className="program-hub-section bg-white">
          <div className="mx-auto max-w-7xl px-4">
            <div className="program-hub-section-head">
              <p className="program-hub-section-kicker">Complete guide</p>
              <h2 className="program-hub-section-title">{title}</h2>
            </div>
            <ContentPageShell
              html={wpContent.content}
              featuredImage={wpContent.featuredImage}
              title={title}
              showFeaturedImage={Boolean(wpContent.featuredImage)}
            />
          </div>
        </section>
      ) : null}

      <ProgramHubCta
        title="Not sure which state or college fits your NEET rank?"
        description="Our counsellors compare cut-offs, fees, and admission timelines — free and confidential."
      />
    </div>
  );
}
