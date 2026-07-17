import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ContentJsonLd } from '@/components/content/ContentJsonLd';
import { ContentPageShell } from '@/components/content/ContentPageShell';
import { ProgramPageHero } from '@/components/content/ProgramPageHero';
import { RelatedLinksPills } from '@/components/content/RelatedLinksPills';
import { getContentBySlug } from '@/lib/contentApi';
import { blogPostPath } from '@/lib/blogUtils';
import { PROGRAM_HUB_WP_SLUG, PROGRAM_HUB_SEO } from '@/lib/programHubContent';
import {
  isLocalCollegeBanner,
  resolveCollegeFeaturedImage,
} from '@/lib/collegeFeaturedImage';
import { findProgramContextBySlug } from '@/lib/programBreadcrumbs';
import { buildSiteMetadata } from '@/lib/buildSiteMetadata';
import { plainTitle } from '@/lib/wpHtmlPrepare';
import { resolveSlugAlias } from '@/lib/wpSlugAliases';

const HOME_WP_SLUG = 'mbbs-admission-in-top-colleges';

/** Modern program hubs — served by dedicated (marketing) routes, not this catch-all. */
const MODERN_HUB_SLUGS = new Set(['mbbs-abroad', 'mbbs-india', 'md-ms']);

/** Legacy WordPress hub slugs → canonical Next routes (single hop). */
const LEGACY_HUB_SLUG_REDIRECTS: Record<string, string> = {
  [PROGRAM_HUB_WP_SLUG.abroad]: PROGRAM_HUB_SEO.abroad.path,
  [PROGRAM_HUB_WP_SLUG.india]: PROGRAM_HUB_SEO.india.path,
  [PROGRAM_HUB_WP_SLUG.mdms]: PROGRAM_HUB_SEO.mdms.path,
  'mbbs-in-abroad': PROGRAM_HUB_SEO.abroad.path,
};

/** Cache published pages; bust on Payload sync via /api/revalidate */
export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  if (decoded === HOME_WP_SLUG) {
    return { title: 'AR Group of Education' };
  }

  const content = await getContentBySlug(decoded);
  if (!content) {
    return { title: 'Not Found' };
  }

  const featuredImage = resolveCollegeFeaturedImage(decoded, content.featuredImage);
  return buildSiteMetadata(
    featuredImage && featuredImage !== content.featuredImage
      ? { ...content, featuredImage, ogImage: featuredImage }
      : content
  );
}

export default async function WpSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  if (MODERN_HUB_SLUGS.has(decoded)) {
    notFound();
  }

  const legacyHub = LEGACY_HUB_SLUG_REDIRECTS[decoded];
  if (legacyHub) {
    redirect(legacyHub);
  }

  const alias = resolveSlugAlias(decoded);
  if (alias) redirect(alias);

  if (decoded === HOME_WP_SLUG) {
    redirect('/');
  }

  const content = await getContentBySlug(decoded);
  if (!content) {
    notFound();
  }

  if (content.type === 'post') {
    redirect(blogPostPath(decoded));
  }

  const title = plainTitle(content.title);
  // Keep a single on-page H1 from the page title; metaTitle is used only for <title>/OG.
  const heroTitle = title;
  const heroSubtitle = content.metaDescription?.trim() || undefined;
  const program = findProgramContextBySlug(decoded);
  const featuredImage = resolveCollegeFeaturedImage(decoded, content.featuredImage);
  const heroImageFit = isLocalCollegeBanner(featuredImage) ? 'state' : 'default';

  const breadcrumbs = program?.breadcrumbs ?? [
    { label: title },
  ];

  const theme = program?.theme ?? 'default';
  const badge = program?.badge ?? 'Guide';
  const published = content.publishedAt
    ? new Date(content.publishedAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <>
      <ContentJsonLd content={content} breadcrumbs={breadcrumbs} />

      <ProgramPageHero
        title={heroTitle}
        badge={badge}
        theme={theme}
        breadcrumbs={breadcrumbs}
        subtitle={heroSubtitle}
        featuredImage={featuredImage}
        heroImageFit={heroImageFit}
      />

      <ContentPageShell
        html={content.content}
        featuredImage={featuredImage}
        title={title}
        showFeaturedImage={false}
        pageSlug={decoded}
        published={published}
        publishedLabel="Last updated"
        articleClassName={program?.program === 'india' ? 'wp-content-mbbs-india' : undefined}
      />

      <div className="border-t border-slate-200 bg-white py-6 sm:py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-4">
          <Link
            href={
              program?.program === 'india'
                ? '/mbbs-india'
                : program?.program === 'abroad'
                  ? '/mbbs-abroad'
                  : '/'
            }
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-navy-900 transition hover:text-gold-600"
          >
            <ArrowLeft className="h-4 w-4" />
            {program
              ? `Back to MBBS ${program.program === 'india' ? 'India' : 'Abroad'}`
              : 'Back to home'}
          </Link>
          <Link
            href="/contact"
            className="site-gold-cta inline-flex min-h-[44px] w-full items-center justify-center sm:w-auto"
          >
            Expert counselling
          </Link>
        </div>
      </div>

      {program?.relatedLinks.length ? (
        <RelatedLinksPills title={program.relatedTitle} links={program.relatedLinks} />
      ) : null}
    </>
  );
}
