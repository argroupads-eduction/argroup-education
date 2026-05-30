import Link from 'next/link';
import type { BlogListItem } from '@/lib/contentApi';
import { BlogImage } from './BlogImage';
import { blogCardExcerpt, formatBlogDate } from '@/lib/blogUtils';

type BlogLatestSidebarProps = {
  posts: BlogListItem[];
  currentSlug?: string;
  title?: string;
};

export function BlogLatestSidebar({
  posts,
  currentSlug,
  title = 'Latest blogs',
}: BlogLatestSidebarProps) {
  const items = posts.filter((p) => p.slug !== currentSlug).slice(0, 8);

  if (!items.length) return null;

  return (
    <aside className="blog-sidebar" aria-label={title}>
      <div className="blog-sidebar__panel">
        <h2 className="blog-sidebar__title">{title}</h2>
        <ul className="blog-sidebar__list">
          {items.map((post, index) => (
            <li key={post.id}>
              <Link href={`/${post.slug}`} className="blog-sidebar__item">
                <span className="blog-sidebar__index" aria-hidden>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="blog-sidebar__thumb">
                  {post.featuredImage ? (
                    <BlogImage src={post.featuredImage} alt="" variant="thumb" sizes="88px" />
                  ) : (
                    <span className="blog-sidebar__thumb-fallback">📰</span>
                  )}
                </span>
                <span className="blog-sidebar__meta">
                  <span className="blog-sidebar__item-title">{post.title}</span>
                  <span className="blog-sidebar__date">{formatBlogDate(post.publishedAt)}</span>
                  <span className="blog-sidebar__excerpt line-clamp-2">
                    {blogCardExcerpt(post.excerpt)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/blog" className="blog-sidebar__all">
          View all articles →
        </Link>
      </div>
    </aside>
  );
}
