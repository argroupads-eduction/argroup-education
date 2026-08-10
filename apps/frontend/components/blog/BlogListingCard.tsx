'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { BlogListItem } from '@/lib/contentApi';
import { blogCardExcerpt, blogPostPath, formatBlogDate } from '@/lib/blogUtils';
import { BlogImage } from './BlogImage';

type BlogListingCardProps = {
  blog: BlogListItem;
  variant?: 'featured' | 'compact';
};

export function BlogListingCard({ blog, variant = 'compact' }: BlogListingCardProps) {
  const router = useRouter();
  const excerpt = blogCardExcerpt(blog.excerpt);
  const date = formatBlogDate(blog.publishedAt);
  const href = blogPostPath(blog.slug);
  const warm = () => {
    router.prefetch(href);
  };

  if (variant === 'featured') {
    return (
      <article className="blog-card blog-card--featured">
        <Link
          href={href}
          prefetch
          onMouseEnter={warm}
          onFocus={warm}
          className="blog-card__link"
        >
          <div className="blog-card__media">
            {blog.featuredImage ? (
              <BlogImage
                src={blog.featuredImage}
                alt={blog.title}
                variant="featured"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
            ) : (
              <div className="blog-card__media-fallback" aria-hidden>
                {blog.category || 'Blog'}
              </div>
            )}
            <span className="blog-card__badge">Featured</span>
          </div>
          <div className="blog-card__body">
            <div className="blog-card__meta">
              <span className="blog-card__category">{blog.category}</span>
              <time dateTime={blog.publishedAt}>{date}</time>
            </div>
            <h2 className="blog-card__title">{blog.title}</h2>
            <p className="blog-card__excerpt">{excerpt}</p>
            <span className="blog-card__cta">Read full article →</span>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="blog-card blog-card--compact">
      <Link
        href={href}
        prefetch
        onMouseEnter={warm}
        onFocus={warm}
        className="blog-card__link blog-card__link--row"
      >
        <div className="blog-card__media blog-card__media--sm">
          {blog.featuredImage ? (
            <BlogImage src={blog.featuredImage} alt={blog.title} variant="compact" sizes="200px" />
          ) : (
            <div className="blog-card__media-fallback blog-card__media-fallback--sm" aria-hidden>
              {blog.category || 'Blog'}
            </div>
          )}
        </div>
        <div className="blog-card__body">
          <div className="blog-card__meta">
            <span className="blog-card__category">{blog.category}</span>
            <time dateTime={blog.publishedAt}>{date}</time>
          </div>
          <h2 className="blog-card__title blog-card__title--sm">{blog.title}</h2>
          <p className="blog-card__excerpt">{excerpt}</p>
          <span className="blog-card__cta">Read more →</span>
        </div>
      </Link>
    </article>
  );
}
