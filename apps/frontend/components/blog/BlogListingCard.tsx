import Link from 'next/link';
import Image from 'next/image';
import type { BlogListItem } from '@/lib/contentApi';
import { blogCardExcerpt, formatBlogDate } from '@/lib/blogUtils';

type BlogListingCardProps = {
  blog: BlogListItem;
  variant?: 'featured' | 'compact';
};

export function BlogListingCard({ blog, variant = 'compact' }: BlogListingCardProps) {
  const excerpt = blogCardExcerpt(blog.excerpt);
  const date = formatBlogDate(blog.publishedAt);

  if (variant === 'featured') {
    return (
      <article className="blog-card blog-card--featured">
        <Link href={`/${blog.slug}`} className="blog-card__link">
          <div className="blog-card__media">
            {blog.featuredImage ? (
              <Image
                src={blog.featuredImage}
                alt={blog.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                unoptimized
                priority
              />
            ) : (
              <div className="blog-card__media-fallback" aria-hidden>
                MBBS Guides
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
      <Link href={`/${blog.slug}`} className="blog-card__link blog-card__link--row">
        <div className="blog-card__media blog-card__media--sm">
          {blog.featuredImage ? (
            <Image
              src={blog.featuredImage}
              alt={blog.title}
              fill
              className="object-cover"
              sizes="160px"
              unoptimized
            />
          ) : (
            <div className="blog-card__media-fallback blog-card__media-fallback--sm" aria-hidden>
              📚
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
