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
import { getBlogPostPageDataCached as getBlogPostPageData } from '@/lib/blogPost.server';
import type { SiteContent } from '@/lib/contentApi';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

function toSiteContent(post: NonNullable<
  Awaited<ReturnType<typeof getBlogPostPageData>>['post']
>): SiteContent {
  const publishedAt =
    post.publishedAt instanceof Date
      ? post.publishedAt.toISOString()
      : post.publishedAt
        ? String(post.publishedAt)
        : null;
  const updatedAt =
    post.updatedAt instanceof Date
      ? post.updatedAt.toISOString()
      : String(post.updatedAt ?? new Date().toISOString());

  return {
    id: post.id,
    type: 'post',
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    canonicalUrl: post.canonicalUrl,
    keywords: post.keywords,
    publishedAt,
    updatedAt,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: segments } = await params;
  const decoded = slugFromBlogRouteSegments(segments ?? []);
  if (!decoded || BLOG_REMOVED_PUBLIC_SLUGS.has(decoded)) {
    return { title: 'Not Found' };
  }
  const { post } = await getBlogPostPageData(decoded);
  if (!post) return { title: 'Not Found' };
  return buildSiteMetadata(toSiteContent(post), {
    canonicalPath: blogPostPath(post.slug),
  });
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

  const { post, latestPosts } = await getBlogPostPageData(decoded);
  if (!post) notFound();

  const content = toSiteContent(post);
  const breadcrumbs = [{ label: 'Blog', href: '/blog' }, { label: content.title }];

  return (
    <>
      <ContentJsonLd content={content} breadcrumbs={breadcrumbs} />
      <BlogPostLayout content={content} latestPosts={latestPosts} breadcrumbs={breadcrumbs} />
    </>
  );
}
