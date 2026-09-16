import type { ReactNode } from 'react';
import { FitImage } from '@/components/ui/FitImage';
import { fixAbroadWpContent } from '@/lib/fixAbroadWpContent';
import { prepareAbroadHubHtml } from '@/lib/prepareAbroadHubHtml';
import { prepareWpHtml } from '@/lib/wpHtmlPrepare';
import { parseContentStructure } from '@/lib/wpContentStructure';
import { sanitizeCmsHtml } from '@/lib/sanitizeCmsHtml';
import { MbbsAbroadWpEnhancer } from '@/components/mbbs-abroad/MbbsAbroadWpEnhancer';
import { QuickFactsGrid } from './QuickFactsGrid';
import { ContentTableOfContents } from './ContentTableOfContents';
import { WpFaqEnhancer } from './WpFaqEnhancer';
import { WpLazyReveal } from './WpLazyReveal';
import { ContentSidebar } from './ContentSidebar';

type ContentArticleProps = {
  html: string;
  featuredImage?: string | null;
  title: string;
  showFeaturedImage?: boolean;
  published?: string | null;
  publishedLabel?: string;
  /** Pre-parsed on server, avoids double transform + hydration drift */
  structuredHtml?: string;
  headings?: ReturnType<typeof parseContentStructure>['headings'];
  quickFacts?: ReturnType<typeof parseContentStructure>['quickFacts'];
  /** Extra classes on article root (e.g. wp-content-abroad-hub) */
  articleClassName?: string;
  /** WP slug for MBBS India state landmark injection in body HTML */
  pageSlug?: string | null;
};

export function ContentArticle({
  html,
  featuredImage,
  title,
  showFeaturedImage = true,
  published,
  publishedLabel = 'Last updated',
  structuredHtml: structuredHtmlProp,
  headings: headingsProp,
  quickFacts: quickFactsProp,
  articleClassName,
  pageSlug,
}: ContentArticleProps) {
  const parsed =
    structuredHtmlProp !== undefined
      ? {
          html: sanitizeCmsHtml(structuredHtmlProp),
          headings: headingsProp ?? [],
          quickFacts: quickFactsProp ?? [],
        }
      : parseContentStructure(
          sanitizeCmsHtml(
            prepareWpHtml(html, {
              featuredImage,
              title,
              pageSlug,
              dedupeFeaturedInBody: showFeaturedImage,
            })
          )
        );
  const { html: structuredHtml, headings, quickFacts } = parsed;
  const safeHtml = sanitizeCmsHtml(structuredHtml);
  const displayFeatured = showFeaturedImage && featuredImage;

  return (
    <article
      className={[
        'wp-content-root wp-content-premium wp-content-affinity',
        articleClassName,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <WpLazyReveal />
      <WpFaqEnhancer />

      {displayFeatured ? (
        <div className="mb-10 overflow-hidden rounded-2xl bg-slate-100 shadow-lg ring-1 ring-black/5">
          <FitImage
            src={featuredImage}
            alt={title}
            priority
            fit="cover"
            frameClassName="rounded-2xl"
          />
        </div>
      ) : null}

      {published ? (
        <p className="mb-6 text-sm font-medium text-slate-500">
          {publishedLabel} · {published}
        </p>
      ) : null}

      <QuickFactsGrid facts={quickFacts} />

      <ContentTableOfContents headings={headings} variant="mobile" />

      <div
        className="wp-content wp-content-body"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </article>
  );
}

type ContentPageShellProps = ContentArticleProps & {
  sidebarExtra?: ReactNode;
  variant?: 'default' | 'abroad-hub';
  showSidebar?: boolean;
};

export function ContentPageShell({
  sidebarExtra,
  variant = 'default',
  showSidebar = true,
  ...articleProps
}: ContentPageShellProps) {
  const isAbroadHub = variant === 'abroad-hub';

  const rawHtml = isAbroadHub
    ? prepareAbroadHubHtml(articleProps.html)
    : articleProps.html;

  let prepared = prepareWpHtml(rawHtml, {
    featuredImage: articleProps.featuredImage,
    title: articleProps.title,
    pageSlug: articleProps.pageSlug,
    dedupeFeaturedInBody: articleProps.showFeaturedImage !== false,
  });
  if (isAbroadHub) prepared = fixAbroadWpContent(prepared);
  const { html: structuredHtml, headings, quickFacts } = parseContentStructure(prepared);

  return (
    <div
      className={
        isAbroadHub
          ? 'abroad-guide-shell py-8 md:py-12'
          : 'bg-gradient-to-b from-white via-white to-slate-50/90 py-6 sm:py-8 md:py-14'
      }
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div
          className={
            showSidebar
              ? 'grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-14'
              : 'min-w-0'
          }
        >
          <div className="min-w-0">
            {isAbroadHub ? <MbbsAbroadWpEnhancer /> : null}
            <ContentArticle
              {...articleProps}
              structuredHtml={structuredHtml}
              headings={headings}
              quickFacts={quickFacts}
              articleClassName={
                [articleProps.articleClassName, isAbroadHub ? 'wp-content-abroad-hub' : '']
                  .filter(Boolean)
                  .join(' ') || undefined
              }
            />
          </div>
          {showSidebar ? (
            <aside className="space-y-4 sm:space-y-5 lg:sticky lg:top-24 lg:self-start">
              <ContentTableOfContents headings={headings} variant="sidebar" />
              <ContentSidebar />
              {sidebarExtra}
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
