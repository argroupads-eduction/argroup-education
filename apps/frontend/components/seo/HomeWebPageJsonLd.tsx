import { buildHomeWebPageSchema } from '@/lib/organizationSchema';

/** Homepage WebPage + BreadcrumbList JSON-LD. */
export function HomeWebPageJsonLd() {
  const schema = buildHomeWebPageSchema();
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
