import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogPostLayout } from '@/components/blog/BlogPostLayout';
import { ContentJsonLd } from '@/components/content/ContentJsonLd';
import { buildSiteMetadata } from '@/lib/buildSiteMetadata';
import { slugFromBlogRouteSegments } from '@/lib/blogUtils';
import { getBlogPosts, getContentBySlug } from '@/lib/contentApi';

export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: segments } = await params;
  const decoded = slugFromBlogRouteSegments(segments ?? []);
  const content = await getContentBySlug(decoded);
  if (!content || content.type !== 'post') {
    return { title: 'Not Found' };
  }
  return buildSiteMetadata(content);
}

export default async function BlogSlugPage({ params }: PageProps) {
  const { slug: segments } = await params;
  const decoded = slugFromBlogRouteSegments(segments ?? []);
  if (!decoded) notFound();

  const content = await getContentBySlug(decoded);
  if (!content || content.type !== 'post') {
    notFound();
  }

  const { data: latestPosts } = await getBlogPosts(1, 12);
  const breadcrumbs = [{ label: 'Blog', href: '/blog' }, { label: content.title }];

  return (
    <>
      <ContentJsonLd content={content} breadcrumbs={breadcrumbs} />
      <BlogPostLayout content={content} latestPosts={latestPosts} breadcrumbs={breadcrumbs} />
    </>
  );
}
