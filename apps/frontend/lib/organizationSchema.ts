import { CONTACT_INFO, SOCIAL_LINKS } from '@/lib/constants';
import { getSiteUrl } from '@/lib/siteUrl';

/** Canonical IDs for cross-referencing JSON-LD graphs. */
export function getOrganizationSchemaIds(siteUrl = getSiteUrl()) {
  const base = siteUrl.replace(/\/$/, '');
  return {
    organization: `${base}/#organization`,
    website: `${base}/#website`,
    localBusiness: `${base}/#localbusiness`,
    webpage: `${base}/#webpage`,
    breadcrumb: `${base}/#breadcrumb`,
    faq: `${base}/#faq`,
    primaryImage: `${base}/#primaryimage`,
  } as const;
}

function logoUrl(siteUrl: string) {
  return `${siteUrl.replace(/\/$/, '')}/ar-group-logo.webp`;
}

function sameAsLinks(): string[] {
  const wanted = new Set(['facebook', 'instagram', 'linkedin', 'youtube']);
  const fromConstants = SOCIAL_LINKS.filter((s) => wanted.has(s.platform)).map((s) => s.url);
  // Ensure LinkedIn from the editorial schema doc is present even if not in nav icons.
  const extras = ['https://in.linkedin.com/company/ar-group-of-education'];
  return [...new Set([...fromConstants, ...extras])];
}

/**
 * Organization + WebSite + LocalBusiness from AR Group schema doc.
 * Injected site-wide so Google can resolve publisher/@id on every page.
 */
export function buildSiteOrganizationGraph(siteUrl = getSiteUrl()) {
  const base = siteUrl.replace(/\/$/, '');
  const ids = getOrganizationSchemaIds(base);
  const logo = logoUrl(base);
  const sameAs = sameAsLinks();

  const organization = {
    '@type': 'Organization',
    '@id': ids.organization,
    name: 'AR Group of Education',
    legalName: 'AR Group of Education',
    url: `${base}/`,
    logo: {
      '@type': 'ImageObject',
      url: logo,
      width: 512,
      height: 512,
    },
    image: logo,
    description:
      'AR Group of Education is a medical education consultancy in India providing expert guidance for MBBS Admission in India, MBBS Abroad, NEET UG Counselling, NEET PG Counselling, MD/MS Admission, and career counselling for aspiring medical students.',
    foundingDate: '2005',
    email: CONTACT_INFO.email,
    telephone: CONTACT_INFO.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '523, 5th Floor, Wave Silver Tower, Sector 18',
      addressLocality: 'Noida',
      addressRegion: 'Uttar Pradesh',
      postalCode: '201301',
      addressCountry: 'IN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Admissions',
      telephone: CONTACT_INFO.phone,
      email: CONTACT_INFO.email,
      url: `${base}/contact`,
      areaServed: 'IN',
      availableLanguage: ['English', 'Hindi'],
    },
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    knowsAbout: [
      'MBBS Admission in India',
      'MBBS Abroad',
      'NEET UG Counselling',
      'NEET PG Counselling',
      'Medical Admission Guidance',
      'MD/MS Admission',
      'Study MBBS Abroad',
      'Medical Education',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Medical Admission Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'MBBS Admission in India' },
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'MBBS Abroad' },
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'NEET UG Counselling' },
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'NEET PG Counselling' },
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'MD/MS Admission' },
        },
      ],
    },
    sameAs,
  };

  const website = {
    '@type': 'WebSite',
    '@id': ids.website,
    url: `${base}/`,
    name: 'AR Group of Education',
    publisher: { '@id': ids.organization },
    inLanguage: 'en-IN',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${base}/blog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const localBusiness = {
    '@type': 'LocalBusiness',
    '@id': ids.localBusiness,
    name: 'AR Group of Education',
    url: `${base}/`,
    description:
      'AR Group of Education is a trusted medical education consultancy providing expert guidance for MBBS Admission in India, MBBS Abroad, NEET UG Counselling, NEET PG Counselling, MD/MS Admission, and medical career counselling.',
    image: logo,
    logo: {
      '@type': 'ImageObject',
      url: logo,
    },
    telephone: CONTACT_INFO.phone,
    email: CONTACT_INFO.email,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '523, 5th Floor, Wave Silver Tower, Sector 18',
      addressLocality: 'Noida',
      addressRegion: 'Uttar Pradesh',
      postalCode: '201301',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '28.5717218',
      longitude: '77.3055674',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '00:00',
        closes: '23:59',
      },
    ],
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    knowsAbout: [
      'MBBS Admission in India',
      'MBBS Abroad',
      'NEET UG Counselling',
      'NEET PG Counselling',
      'Medical Admission Guidance',
      'MD/MS Admission',
      'Study MBBS Abroad',
    ],
    sameAs,
    parentOrganization: { '@id': ids.organization },
    mainEntityOfPage: { '@id': ids.website },
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [organization, website, localBusiness],
  };
}

/** Homepage WebPage + breadcrumb (FAQ stays in HomeFaqJsonLd). */
export function buildHomeWebPageSchema(siteUrl = getSiteUrl()) {
  const base = siteUrl.replace(/\/$/, '');
  const ids = getOrganizationSchemaIds(base);
  const logo = logoUrl(base);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': ids.webpage,
        url: `${base}/`,
        name: 'AR Group of Education | MBBS Admission in India & Abroad',
        description:
          'AR Group of Education is a trusted medical education consultancy providing expert guidance for MBBS Admission in India, MBBS Abroad, NEET UG Counselling, NEET PG Counselling, and MD/MS Admission.',
        isPartOf: { '@id': ids.website },
        about: { '@id': ids.organization },
        publisher: { '@id': ids.organization },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          '@id': ids.primaryImage,
          url: logo,
        },
        inLanguage: 'en-IN',
        potentialAction: {
          '@type': 'ReadAction',
          target: [`${base}/`],
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': ids.breadcrumb,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${base}/`,
          },
        ],
      },
    ],
  };
}
