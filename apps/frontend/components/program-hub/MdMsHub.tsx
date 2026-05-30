import { ContentJsonLd } from '@/components/content/ContentJsonLd';
import { ContentPageShell } from '@/components/content/ContentPageShell';
import { MdMsHubExplorer } from '@/components/program-hub/MdMsHubExplorer';
import { ProgramHubCta } from '@/components/program-hub/ProgramHubCta';
import { ProgramHubHero } from '@/components/program-hub/ProgramHubHero';
import { ProgramHubTrustBar } from '@/components/program-hub/ProgramHubTrustBar';
import type { SiteContent } from '@/lib/contentApi';
import { MD_MS_NAV_ITEMS } from '@/lib/mdMsNav';
import { PROGRAM_HUB_SEO } from '@/lib/programHubContent';
import { plainTitle } from '@/lib/wpHtmlPrepare';

type MdMsHubProps = {
  wpContent: SiteContent | null;
};

export function MdMsHub({ wpContent }: MdMsHubProps) {
  const seo = PROGRAM_HUB_SEO.mdms;
  const title = plainTitle(wpContent?.title || 'MD/MS Admission in India');
  const breadcrumbs = [{ label: 'MD / MS' }];

  const contentForJsonLd: SiteContent =
    wpContent ??
    ({
      id: 'md-ms-hub',
      type: 'page',
      title,
      slug: 'md-ms',
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
        theme="mdms"
        badge={seo.badge}
        breadcrumbs={breadcrumbs}
        title={
          <>
            Postgraduate{' '}
            <span className="program-hub-title-accent">MD/MS admissions</span>
          </>
        }
        lead={seo.description}
        stats={[
          { label: 'States', value: String(MD_MS_NAV_ITEMS.length) },
          { label: 'Guidance', value: 'Free' },
          { label: 'Counselling', value: 'Expert' },
        ]}
      />

      <ProgramHubTrustBar />
      <MdMsHubExplorer />

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
        title="Need help with MD/MS seat selection?"
        description="Talk to our PG admission counsellors for state-wise counselling strategy."
      />
    </div>
  );
}
