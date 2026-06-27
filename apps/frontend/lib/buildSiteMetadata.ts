import type { Metadata } from 'next';
import type { SiteContent } from '@/lib/contentApi';
import { getCuratedPageSeo } from '@/lib/curatedPageSeo';
import { plainTitle, metaDescriptionFromContent } from '@/lib/wpHtmlPrepare';

import { getSiteUrl } from '@/lib/siteUrl';

const SITE_URL = getSiteUrl();

export type SiteMetadataOptions = {
  /** Override canonical path when slug route differs (e.g. program hubs). */
  canonicalPath?: string;
  /** Fallback when no meta title exists. */
  fallbackTitle?: string;
};

/**
 * Build Next.js Metadata from Yoast-migrated SiteContent (Neon or wp-export).
 */
export function buildSiteMetadata(
  content: Pick<
    SiteContent,
    | 'title'
    | 'slug'
    | 'type'
    | 'excerpt'
    | 'content'
    | 'featuredImage'
    | 'metaTitle'
    | 'metaDescription'
    | 'canonicalUrl'
    | 'focusKeyword'
    | 'keywords'
    | 'ogTitle'
    | 'ogDescription'
    | 'ogImage'
    | 'twitterTitle'
    | 'twitterDescription'
  >,
  options?: SiteMetadataOptions
): Metadata {
  const canonicalPath = options?.canonicalPath ?? `/${content.slug}`;
  const curated = getCuratedPageSeo(canonicalPath);

  const title = plainTitle(
    curated?.metaTitle || content.metaTitle || options?.fallbackTitle || content.title
  );
  const description =
    curated?.metaDescription ||
    metaDescriptionFromContent(content.metaDescription || content.excerpt, content.content);

  const canonical = options?.canonicalPath
    ? `${SITE_URL}${options.canonicalPath}`
    : content.canonicalUrl || `${SITE_URL}/${content.slug}`;

  const ogTitle = plainTitle(content.ogTitle || title);
  const ogDescription = curated?.metaDescription || content.ogDescription?.trim() || description;
  const ogImage = content.ogImage || content.featuredImage || undefined;

  const twitterTitle = plainTitle(content.twitterTitle || ogTitle);
  const twitterDescription =
    content.twitterDescription?.trim() || ogDescription;
  const twitterImage = ogImage;

  return {
    title,
    description,
    ...(content.keywords?.length
      ? { keywords: content.keywords }
      : content.focusKeyword
        ? { keywords: [content.focusKeyword] }
        : {}),
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      type: content.type === 'post' ? 'article' : 'website',
      ...(ogImage ? { images: [{ url: ogImage, alt: ogTitle }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: twitterTitle,
      description: twitterDescription,
      ...(twitterImage ? { images: [twitterImage] } : {}),
    },
  };
}

export { SITE_URL };
