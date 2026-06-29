import { getSiteUrl } from '@/lib/siteUrl';
import { getCollegeImageBySlug } from '@/lib/collegeImageIndex';
import { buildImageObjectSchemaFromUrl } from '@/lib/buildImageObjectSchema';

/** Invisible JSON-LD for NEET Rank Predictor crawl/index signals (no UI). */
export function NeetRankPredictorJsonLd() {
  const siteUrl = getSiteUrl();
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
        isPartOf: { '@type': 'WebSite', '@id': `${siteUrl}#website`, url: siteUrl },
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
        publisher: {
          '@type': 'Organization',
          name: 'AR Group of Education',
          url: siteUrl,
        },
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
