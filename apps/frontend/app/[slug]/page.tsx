import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ContentJsonLd } from '@/components/content/ContentJsonLd';
import { ContentPageShell } from '@/components/content/ContentPageShell';
import { ProgramPageHero } from '@/components/content/ProgramPageHero';
import { RelatedLinksPills } from '@/components/content/RelatedLinksPills';
import { getContentBySlug } from '@/lib/contentApi';
import { findProgramContextBySlug } from '@/lib/programBreadcrumbs';
import { plainTitle, metaDescriptionFromContent } from '@/lib/wpHtmlPrepare';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://argroupofeducation.com';
const HOME_WP_SLUG = 'mbbs-admission-in-top-colleges';

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

  const title = plainTitle(content.metaTitle || content.title);
  const description = metaDescriptionFromContent(content.metaDescription || content.excerpt, content.content);
  const canonical = content.canonicalUrl || `${SITE_URL}/${content.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: content.type === 'post' ? 'article' : 'website',
      ...(content.featuredImage ? { images: [{ url: content.featuredImage, alt: title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(content.featuredImage ? { images: [content.featuredImage] } : {}),
    },
  };
}

export default async function WpSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  if (decoded === HOME_WP_SLUG) {
    redirect('/');
  }

  const content = await getContentBySlug(decoded);
  if (!content) {
    notFound();
  }

  const title = plainTitle(content.title);
  const program = findProgramContextBySlug(decoded);
  const published = content.publishedAt
    ? new Date(content.publishedAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const breadcrumbs = program?.breadcrumbs ?? [
    ...(content.type === 'post' ? [{ label: 'Blog', href: '/blog' }] : []),
    { label: title },
  ];

  const theme = program?.theme ?? (content.type === 'post' ? 'default' : 'default');
  const badge = program?.badge ?? (content.type === 'post' ? 'Blog' : 'Guide');

  return (
    <>
      <ContentJsonLd content={content} breadcrumbs={breadcrumbs} />

      <ProgramPageHero
        title={title}
        badge={badge}
        theme={theme}
        breadcrumbs={breadcrumbs}
        subtitle={metaDescriptionFromContent(content.excerpt, content.content, 220)}
        featuredImage={content.featuredImage}
      />

      <ContentPageShell
        html={content.content}
        featuredImage={content.featuredImage}
        title={title}
        showFeaturedImage={false}
        published={published}
        publishedLabel={content.type === 'post' ? 'Published' : 'Last updated'}
      />

      <div className="border-t border-slate-200 bg-white py-6 sm:py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-4">
          <Link
            href={
              content.type === 'post'
                ? '/blog'
                : program?.program === 'india'
                  ? '/mbbs-india'
                  : program?.program === 'abroad'
                    ? '/mbbs-abroad'
                    : '/'
            }
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-navy-900 transition hover:text-gold-600"
          >
            <ArrowLeft className="h-4 w-4" />
            {content.type === 'post'
              ? 'All articles'
              : program
                ? `Back to MBBS ${program.program === 'india' ? 'India' : 'Abroad'}`
                : 'Back to home'}
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-gold-500 px-5 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-gold-400 sm:w-auto"
          >
            Free counselling
          </Link>
        </div>
      </div>

      {program?.relatedLinks.length ? (
        <RelatedLinksPills title={program.relatedTitle} links={program.relatedLinks} />
      ) : null}
    </>
  );
}
