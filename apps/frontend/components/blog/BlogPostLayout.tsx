import Link from 'next/link';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import type { BlogListItem, SiteContent } from '@/lib/contentApi';
import { prepareWpHtml, metaDescriptionFromContent } from '@/lib/wpHtmlPrepare';
import { parseContentStructure } from '@/lib/wpContentStructure';
import { ContentTableOfContents } from '@/components/content/ContentTableOfContents';
import { QuickFactsGrid } from '@/components/content/QuickFactsGrid';
import { WpFaqEnhancer } from '@/components/content/WpFaqEnhancer';
import { WpLazyReveal } from '@/components/content/WpLazyReveal';
import { BlogImage } from './BlogImage';
import { BlogLatestSidebar } from './BlogLatestSidebar';
import { formatBlogDate, readingTimeMinutes } from '@/lib/blogUtils';

type BlogPostLayoutProps = {
  content: SiteContent;
  latestPosts: BlogListItem[];
  breadcrumbs?: { label: string; href?: string }[];
};

export function BlogPostLayout({ content, latestPosts, breadcrumbs }: BlogPostLayoutProps) {
  const prepared = prepareWpHtml(content.content, {
    featuredImage: content.featuredImage,
    title: content.title,
  });
  const { html: structuredHtml, headings, quickFacts } = parseContentStructure(prepared);
  const published = content.publishedAt ? formatBlogDate(content.publishedAt) : null;
  const readMin = readingTimeMinutes(content.content);
  const dek = metaDescriptionFromContent(content.excerpt, content.content, 220);

  const crumbs = breadcrumbs ?? [
    { label: 'Blog', href: '/blog' },
    { label: content.title },
  ];

  return (
    <div className="blog-root blog-post-root">
      <header className="blog-post-hero">
        <div className="mx-auto max-w-7xl px-4">
          <nav className="blog-breadcrumb" aria-label="Breadcrumb">
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="blog-breadcrumb__segment">
                {i > 0 ? <span aria-hidden>/</span> : null}
                {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
              </span>
            ))}
          </nav>

          <div className="blog-post-hero__inner">
            <div className="blog-post-hero__copy">
              <span className="blog-post-hero__badge">Blog · MBBS Guides</span>
              <h1 className="blog-post-hero__title">{content.title}</h1>
              {dek ? <p className="blog-post-hero__dek">{dek}</p> : null}
              <div className="blog-post-hero__meta">
                {published ? (
                  <span className="blog-post-hero__meta-item">
                    <Calendar className="h-4 w-4" aria-hidden />
                    <time dateTime={content.publishedAt ?? undefined}>{published}</time>
                  </span>
                ) : null}
                <span className="blog-post-hero__meta-item">
                  <Clock className="h-4 w-4" aria-hidden />
                  {readMin} min read
                </span>
              </div>
            </div>
            {content.featuredImage ? (
              <BlogImage
                src={content.featuredImage}
                alt={content.title}
                variant="hero"
                priority
                sizes="(max-width: 1024px) 100vw, 420px"
              />
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-16 md:pb-24">
        <div className="blog-post-grid">
          <article className="blog-article wp-content-root wp-content-affinity min-w-0">
            <WpLazyReveal />
            <WpFaqEnhancer />
            <ContentTableOfContents headings={headings} variant="mobile" />

            <QuickFactsGrid facts={quickFacts} />

            <div
              className="wp-content wp-content-body wp-content-blog"
              dangerouslySetInnerHTML={{ __html: structuredHtml }}
            />

            <BlogPostFooter />
          </article>

          <div className="blog-post-aside space-y-5 lg:sticky lg:top-24 lg:self-start">
            <ContentTableOfContents headings={headings} variant="sidebar" />
            <BlogLatestSidebar posts={latestPosts} currentSlug={content.slug} title="Latest blogs" />
            <BlogCounsellingCard />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4">
          <Link
            href="/blog"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-navy-900 hover:text-gold-600"
          >
            <ArrowLeft className="h-4 w-4" />
            All articles
          </Link>
        </div>
      </div>
    </div>
  );
}

function BlogPostFooter() {
  return (
    <div className="blog-article-cta mt-10 rounded-2xl border border-gold-200/70 bg-gradient-to-r from-amber-50 via-white to-slate-50 p-6 md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-700">Need guidance?</p>
      <p className="mt-2 font-serif text-xl font-bold text-navy-900 md:text-2xl">
        Free MBBS counselling — India & Abroad
      </p>
      <p className="mt-2 text-sm text-slate-600">
        College shortlisting, fees, NEET eligibility, and documentation support.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/contact"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-navy-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-navy-800"
        >
          Book free counselling
        </Link>
        <a
          href="tel:+917076909090"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border-2 border-navy-900/15 px-6 py-2.5 text-sm font-semibold text-navy-900 hover:border-gold-400"
        >
          +91-7076909090
        </a>
      </div>
    </div>
  );
}

function BlogCounsellingCard() {
  return (
    <div className="blog-counselling-card rounded-2xl border border-navy-900/10 bg-navy-900 p-5 text-white shadow-lg">
      <p className="font-serif text-lg font-bold">Talk to a counsellor</p>
      <p className="mt-2 text-sm text-blue-100/90">
        Get personalised MBBS India or Abroad guidance within 24 hours.
      </p>
      <Link
        href="/contact"
        className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-gold-500 text-sm font-bold text-navy-900 hover:bg-gold-400"
      >
        Free counselling
      </Link>
    </div>
  );
}
