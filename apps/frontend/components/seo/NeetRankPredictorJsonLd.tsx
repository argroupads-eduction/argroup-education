import { getSiteUrl } from '@/lib/siteUrl';
import { getCollegeImageBySlug } from '@/lib/collegeImageIndex';
import { buildImageObjectSchemaFromUrl } from '@/lib/buildImageObjectSchema';
import { getOrganizationSchemaIds } from '@/lib/organizationSchema';

/** Invisible JSON-LD for NEET Rank Predictor crawl/index signals (no UI). */
export function NeetRankPredictorJsonLd() {
  const siteUrl = getSiteUrl();
  const ids = getOrganizationSchemaIds(siteUrl);
  const pageUrl = `${siteUrl}/neet-rank-predictor`;
  const imageUrl =
    getCollegeImageBySlug('neet-college-rank-predictor') ?? '/ar-group-logo.png';
  const imageObject = buildImageObjectSchemaFromUrl(imageUrl, {
    name: 'NEET Rank Predictor',
    representativeOfPage: true,
  });

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: 'NEET Rank Predictor',
        isPartOf: { '@id': ids.website },
        about: { '@id': ids.organization },
        ...(imageObject ? { primaryImageOfPage: imageObject, image: imageObject } : {}),
      },
      {
        '@type': 'WebApplication',
        '@id': `${pageUrl}#application`,
        url: pageUrl,
        name: 'NEET Rank Predictor',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
        ...(imageObject ? { image: imageObject, screenshot: imageObject } : {}),
        publisher: { '@id': ids.organization },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
