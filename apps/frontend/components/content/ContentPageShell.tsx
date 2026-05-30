import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import { prepareWpHtml } from '@/lib/wpHtmlPrepare';
import { parseContentStructure } from '@/lib/wpContentStructure';
import { QuickFactsGrid } from './QuickFactsGrid';
import { ContentTableOfContents } from './ContentTableOfContents';
import { WpLazyReveal } from './WpLazyReveal';
import { ContentSidebar } from './ContentSidebar';

type ContentArticleProps = {
  html: string;
  featuredImage?: string | null;
  title: string;
  showFeaturedImage?: boolean;
  published?: string | null;
  publishedLabel?: string;
};

export function ContentArticle({
  html,
  featuredImage,
  title,
  showFeaturedImage = true,
  published,
  publishedLabel = 'Last updated',
}: ContentArticleProps) {
  const prepared = prepareWpHtml(html, { featuredImage, title });
  const { html: structuredHtml, headings, quickFacts } = parseContentStructure(prepared);
  const displayFeatured = showFeaturedImage && featuredImage;

  return (
    <article className="wp-content-root wp-content-premium wp-content-affinity">
      <WpLazyReveal />

      {displayFeatured ? (
        <div className="relative mb-10 aspect-[21/9] w-full overflow-hidden rounded-2xl bg-slate-100 shadow-lg ring-1 ring-black/5">
          <Image
            src={featuredImage}
            alt={title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 896px"
            unoptimized
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-900/40 via-transparent to-transparent" />
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
        dangerouslySetInnerHTML={{ __html: structuredHtml }}
      />

      <div className="wp-content-bottom-cta mt-8 rounded-xl border border-gold-200/60 bg-gradient-to-r from-gold-50 via-white to-blue-50 p-4 sm:mt-12 sm:rounded-2xl sm:p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-700">Need guidance?</p>
            <p className="mt-2 text-base font-bold text-navy-900 sm:text-lg md:text-xl">
              Talk to AR Group counsellors — free & confidential
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link
              href="/contact"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-navy-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-800 sm:w-auto"
            >
              Book counselling
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="tel:+917076909090"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border-2 border-navy-900/15 bg-white px-5 py-3 text-sm font-semibold text-navy-900 transition hover:border-gold-400 sm:w-auto"
            >
              <Phone className="h-4 w-4" />
              Call now
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

type ContentPageShellProps = ContentArticleProps & {
  sidebarExtra?: ReactNode;
};

export function ContentPageShell({
  sidebarExtra,
  ...articleProps
}: ContentPageShellProps) {
  const prepared = prepareWpHtml(articleProps.html, {
    featuredImage: articleProps.featuredImage,
    title: articleProps.title,
  });
  const { headings } = parseContentStructure(prepared);

  return (
    <div className="bg-gradient-to-b from-white via-white to-slate-50/90 py-6 sm:py-8 md:py-14">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-14">
          <div className="min-w-0 overflow-x-hidden">
            <ContentArticle {...articleProps} />
          </div>
          <aside className="space-y-4 sm:space-y-5 lg:sticky lg:top-24 lg:self-start">
            <ContentTableOfContents headings={headings} variant="sidebar" />
            <ContentSidebar />
            {sidebarExtra}
          </aside>
        </div>
      </div>
    </div>
  );
}
