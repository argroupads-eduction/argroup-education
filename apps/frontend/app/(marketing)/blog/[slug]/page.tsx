import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogPostLayout } from '@/components/blog/BlogPostLayout';
import { ContentJsonLd } from '@/components/content/ContentJsonLd';
import { buildSiteMetadata } from '@/lib/buildSiteMetadata';
import { getBlogPosts, getContentBySlug } from '@/lib/contentApi';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const content = await getContentBySlug(decoded);
  if (!content || content.type !== 'post') {
    return { title: 'Not Found' };
  }
  return buildSiteMetadata(content);
}

export default async function BlogSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
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
