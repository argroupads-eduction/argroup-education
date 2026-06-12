import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type BlogPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  perPage?: number;
};

function pageHref(page: number): string {
  return page <= 1 ? '/blog' : `/blog?page=${page}`;
}

function visiblePages(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

export function BlogPagination({
  currentPage,
  totalPages,
  totalPosts,
  perPage = 12,
}: BlogPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = visiblePages(currentPage, totalPages);
  const from = (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, totalPosts);

  return (
    <nav className="blog-pagination" aria-label="Blog pages">
      <p className="blog-pagination__summary">
        Showing {from}–{to} of {totalPosts} articles
      </p>

      <div className="blog-pagination__controls">
        {currentPage > 1 ? (
          <Link href={pageHref(currentPage - 1)} className="blog-pagination__btn">
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Previous
          </Link>
        ) : (
          <span className="blog-pagination__btn blog-pagination__btn--disabled">
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Previous
          </span>
        )}

        <div className="blog-pagination__pages">
          {pages.map((page, index) => {
            const prev = pages[index - 1];
            const showEllipsis = prev != null && page - prev > 1;
            return (
              <span key={page} className="blog-pagination__page-wrap">
                {showEllipsis ? <span className="blog-pagination__ellipsis">…</span> : null}
                {page === currentPage ? (
                  <span className="blog-pagination__page blog-pagination__page--active" aria-current="page">
                    {page}
                  </span>
                ) : (
                  <Link href={pageHref(page)} className="blog-pagination__page">
                    {page}
                  </Link>
                )}
              </span>
            );
          })}
        </div>

        {currentPage < totalPages ? (
          <Link href={pageHref(currentPage + 1)} className="blog-pagination__btn">
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <span className="blog-pagination__btn blog-pagination__btn--disabled">
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        )}
      </div>
    </nav>
  );
}
