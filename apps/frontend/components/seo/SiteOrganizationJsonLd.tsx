import { buildSiteOrganizationGraph } from '@/lib/organizationSchema';

/** Site-wide Organization + WebSite + LocalBusiness JSON-LD (all pages). */
export function SiteOrganizationJsonLd() {
  const schema = buildSiteOrganizationGraph();
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
