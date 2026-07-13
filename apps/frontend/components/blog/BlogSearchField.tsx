'use client';

import { useId } from 'react';
import { Search, X } from 'lucide-react';

type BlogSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Large page-top search vs sidebar field */
  variant?: 'hero' | 'sidebar';
  resultCount?: number | null;
  className?: string;
};

export function BlogSearchField({
  value,
  onChange,
  placeholder = 'Search Blog title or keyword',
  variant = 'hero',
  resultCount = null,
  className = '',
}: BlogSearchFieldProps) {
  const inputId = useId();
  const isActive = value.trim().length > 0;

  return (
    <div className={`blog-search blog-search--${variant}${isActive ? ' is-active' : ''} ${className}`.trim()}>
      <div className="blog-search__shell">
        <label htmlFor={inputId} className="sr-only">
          Search blogs by title or URL
        </label>
        <span className="blog-search__icon-wrap" aria-hidden>
          <Search className="blog-search__icon" strokeWidth={2.35} />
        </span>
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="blog-search__input"
        />
        {isActive ? (
          <button
            type="button"
            className="blog-search__clear"
            aria-label="Clear search"
            onClick={() => onChange('')}
          >
            <X className="h-3.5 w-3.5" aria-hidden strokeWidth={2.5} />
            <span className="blog-search__clear-label">Clear</span>
          </button>
        ) : (
          <span className="blog-search__hint" aria-hidden>
            Find
          </span>
        )}
      </div>
      {isActive && resultCount !== null ? (
        <p className="blog-search__meta" role="status">
          {resultCount > 0
            ? `${resultCount} blog${resultCount === 1 ? '' : 's'} found`
            : 'No matching blogs — try another title or URL'}
        </p>
      ) : null}
    </div>
  );
}
