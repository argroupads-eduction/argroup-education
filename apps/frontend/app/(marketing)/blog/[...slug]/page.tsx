import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { BlogPostLayout } from '@/components/blog/BlogPostLayout';
import { ContentJsonLd } from '@/components/content/ContentJsonLd';
import { buildSiteMetadata } from '@/lib/buildSiteMetadata';
import {
  blogPostPath,
  BLOG_REMOVED_PUBLIC_SLUGS,
  BLOG_SLUG_CANONICAL,
  slugFromBlogRouteSegments,
} from '@/lib/blogUtils';
import { getBlogPosts, getContentBySlug } from '@/lib/contentApi';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: segments } = await params;
  const decoded = slugFromBlogRouteSegments(segments ?? []);
  if (!decoded || BLOG_REMOVED_PUBLIC_SLUGS.has(decoded)) {
    return { title: 'Not Found' };
  }
  const content = await getContentBySlug(decoded);
  if (!content || content.type !== 'post') {
    return { title: 'Not Found' };
  }
  return buildSiteMetadata(content, { canonicalPath: blogPostPath(content.slug) });
}

export default async function BlogSlugPage({ params }: PageProps) {
  const { slug: segments } = await params;
  const decoded = slugFromBlogRouteSegments(segments ?? []);
  if (!decoded) notFound();

  if (BLOG_REMOVED_PUBLIC_SLUGS.has(decoded)) {
    notFound();
  }

  const canonical = BLOG_SLUG_CANONICAL[decoded];
  if (canonical) {
    redirect(blogPostPath(canonical));
  }

  const content = await getContentBySlug(decoded);
  if (!content || content.type !== 'post') {
    notFound();
  }

  const { data: latestPosts } = await getBlogPosts(1, 500);
  const breadcrumbs = [{ label: 'Blog', href: '/blog' }, { label: content.title }];

  return (
    <>
      <ContentJsonLd content={content} breadcrumbs={breadcrumbs} />
      <BlogPostLayout content={content} latestPosts={latestPosts} breadcrumbs={breadcrumbs} />
    </>
  );
}
