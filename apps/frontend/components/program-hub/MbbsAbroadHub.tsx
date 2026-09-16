import { ContentJsonLd } from '@/components/content/ContentJsonLd';
import { MbbsAbroadCountryOrbit } from '@/components/mbbs-abroad/MbbsAbroadCountryOrbit';
import { MbbsAbroadDocumentsVault } from '@/components/mbbs-abroad/MbbsAbroadDocumentsVault';
import { MbbsAbroadIntakeRibbon } from '@/components/mbbs-abroad/MbbsAbroadIntakeRibbon';
import { MbbsAbroadHubDirectory } from '@/components/program-hub/MbbsAbroadHubDirectory';
import { MbbsAbroadHubGuide } from '@/components/program-hub/MbbsAbroadHubGuide';
import { ProgramHubCta } from '@/components/program-hub/ProgramHubCta';
import { ProgramHubHero } from '@/components/program-hub/ProgramHubHero';
import { ProgramHubTrustBar } from '@/components/program-hub/ProgramHubTrustBar';
import type { SiteContent } from '@/lib/contentApi';
import { MBBS_ABROAD_COUNTRIES, abroadCollegeCount } from '@/lib/mbbsAbroadTree';
import { MBBS_ABROAD_HUB } from '@/lib/mbbsAbroadHubContent';
import { PROGRAM_HUB_SEO } from '@/lib/programHubContent';

type MbbsAbroadHubProps = {
  /** Yoast / DB metadata only, body HTML is not rendered on the hub. */
  seoContent?: SiteContent | null;
};

export function MbbsAbroadHub({ seoContent }: MbbsAbroadHubProps) {
  const seo = PROGRAM_HUB_SEO.abroad;
  const breadcrumbs = [{ label: 'MBBS Abroad' }];

  const contentForJsonLd: SiteContent =
    seoContent ??
    ({
      id: 'mbbs-abroad-hub',
      type: 'page',
      title: seo.title,
      slug: 'study-mbbs-in-abroad',
      content: MBBS_ABROAD_HUB.overviewLead,
      excerpt: seo.description,
      featuredImage: null,
      metaTitle: seo.title,
      metaDescription: seo.description,
      canonicalUrl: null,
      publishedAt: null,
      updatedAt: new Date().toISOString(),
    } satisfies SiteContent);

  return (
    <div className="program-hub-root program-hub-root--abroad">
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
      <MbbsAbroadIntakeRibbon />
      <MbbsAbroadCountryOrbit />
      <MbbsAbroadHubGuide variant="intro" />
      <MbbsAbroadHubDirectory />
      <MbbsAbroadHubGuide variant="extended" />
      <MbbsAbroadDocumentsVault />

      <ProgramHubCta
        title="Planning MBBS abroad this intake?"
        description="Compare countries, fees, and NMC guidelines with an expert counsellor, no obligation."
      />
    </div>
  );
}
