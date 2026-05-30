import { ContentJsonLd } from '@/components/content/ContentJsonLd';
import { ContentPageShell } from '@/components/content/ContentPageShell';
import { MbbsAbroadHubExplorer } from '@/components/program-hub/MbbsAbroadHubExplorer';
import { ProgramHubCta } from '@/components/program-hub/ProgramHubCta';
import { ProgramHubHero } from '@/components/program-hub/ProgramHubHero';
import { ProgramHubTrustBar } from '@/components/program-hub/ProgramHubTrustBar';
import type { SiteContent } from '@/lib/contentApi';
import { MBBS_ABROAD_COUNTRIES, abroadCollegeCount } from '@/lib/mbbsAbroadTree';
import { PROGRAM_HUB_SEO } from '@/lib/programHubContent';
import { plainTitle } from '@/lib/wpHtmlPrepare';

type MbbsAbroadHubProps = {
  wpContent: SiteContent | null;
};

export function MbbsAbroadHub({ wpContent }: MbbsAbroadHubProps) {
  const seo = PROGRAM_HUB_SEO.abroad;
  const title = plainTitle(wpContent?.title || 'Study MBBS Abroad');
  const breadcrumbs = [{ label: 'MBBS Abroad' }];

  const contentForJsonLd: SiteContent =
    wpContent ??
    ({
      id: 'mbbs-abroad-hub',
      type: 'page',
      title,
      slug: 'study-mbbs-in-abroad',
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
        theme="abroad"
        badge={seo.badge}
        breadcrumbs={breadcrumbs}
        title={
          <>
            Your gateway to{' '}
            <span className="program-hub-title-accent">MBBS Abroad</span>
          </>
        }
        lead={seo.description}
        stats={[
          { label: 'Countries', value: String(MBBS_ABROAD_COUNTRIES.length) },
          { label: 'Universities', value: `${abroadCollegeCount()}+` },
          { label: 'Visa support', value: 'Yes' },
        ]}
      />

      <ProgramHubTrustBar />
      <MbbsAbroadHubExplorer />

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
        title="Planning MBBS abroad this intake?"
        description="Compare countries, fees, and NMC guidelines with an expert counsellor — no obligation."
      />
    </div>
  );
}
