import type { Metadata } from 'next';
import type { SiteContent } from '@/lib/contentApi';
import { plainTitle, metaDescriptionFromContent } from '@/lib/wpHtmlPrepare';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://argroupofeducation.com';

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
    | 'ogTitle'
    | 'ogDescription'
    | 'ogImage'
    | 'twitterTitle'
    | 'twitterDescription'
  >,
  options?: SiteMetadataOptions
): Metadata {
  const title = plainTitle(content.metaTitle || options?.fallbackTitle || content.title);
  const description = metaDescriptionFromContent(
    content.metaDescription || content.excerpt,
    content.content
  );

  const canonical =
    content.canonicalUrl ||
    `${SITE_URL}${options?.canonicalPath ?? `/${content.slug}`}`;

  const ogTitle = plainTitle(content.ogTitle || title);
  const ogDescription =
    content.ogDescription?.trim() || description;
  const ogImage = content.ogImage || content.featuredImage || undefined;

  const twitterTitle = plainTitle(content.twitterTitle || ogTitle);
  const twitterDescription =
    content.twitterDescription?.trim() || ogDescription;
  const twitterImage = ogImage;

  return {
    title,
    description,
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
