import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type ContentBreadcrumbsProps = {
  items: BreadcrumbItem[];
  variant?: 'light' | 'dark';
};

export function ContentBreadcrumbs({ items, variant = 'light' }: ContentBreadcrumbsProps) {
  const isDark = variant === 'dark';

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol
        className={[
          'flex flex-wrap items-center gap-1 text-sm',
          isDark ? 'text-blue-100/80' : 'text-slate-500',
        ].join(' ')}
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        <li
          className="inline-flex items-center gap-1"
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
        >
          <Link
            href="/"
            itemProp="item"
            className={isDark ? 'inline-flex items-center gap-1 hover:text-gold-300' : 'inline-flex items-center gap-1 hover:text-gold-600'}
          >
            <Home className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span itemProp="name">Home</span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>

        {items.map((item, index) => {
          const position = index + 2;
          const isLast = index === items.length - 1;
          return (
            <li
              key={`${item.label}-${index}`}
              className="inline-flex items-center gap-1"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  itemProp="item"
                  className={isDark ? 'hover:text-gold-300' : 'hover:text-gold-600'}
                >
                  <span itemProp="name">{item.label}</span>
                </Link>
              ) : (
                <span itemProp="name" className={isDark ? 'font-medium text-white' : 'font-medium text-navy-900'}>
                  {item.label}
                </span>
              )}
              <meta itemProp="position" content={String(position)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
