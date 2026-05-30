'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import type { ContentHeading } from '@/lib/wpContentStructure';

type ContentTableOfContentsProps = {
  headings: ContentHeading[];
  variant?: 'sidebar' | 'mobile';
};

function scrollToHeading(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function ContentTableOfContents({ headings, variant = 'sidebar' }: ContentTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [open, setOpen] = useState(false);

  const visibleHeadings = useMemo(() => {
    if (variant === 'sidebar') {
      return headings.filter((h) => h.level === 2).slice(0, 12);
    }
    return headings.filter((h) => h.level <= 3).slice(0, 18);
  }, [headings, variant]);

  useEffect(() => {
    if (!visibleHeadings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-15% 0px -60% 0px', threshold: [0, 0.15, 0.4, 1] }
    );

    visibleHeadings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [visibleHeadings]);

  if (!visibleHeadings.length) return null;

  const isMobile = variant === 'mobile';
  const activeIndex = visibleHeadings.findIndex((h) => h.id === activeId);
  const activeLabel = activeIndex >= 0 ? visibleHeadings[activeIndex]?.text : visibleHeadings[0]?.text;

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    scrollToHeading(id);
    setActiveId(id);
    if (isMobile) setOpen(false);
  };

  const list = (
    <ul className="toc-scroll-hide space-y-0.5 p-2 sm:p-2.5">
      {visibleHeadings.map((h, index) => {
        const isActive = activeId === h.id;
        const indent =
          h.level === 3 ? 'pl-5 sm:pl-6' : h.level === 4 ? 'pl-7 sm:pl-8' : h.level >= 5 ? 'pl-9 sm:pl-10' : 'pl-1';

        return (
          <li key={h.id} className={indent}>
            <a
              href={`#${h.id}`}
              onClick={(e) => handleNavClick(e, h.id)}
              className={[
                'group flex min-h-[44px] items-start gap-2.5 rounded-xl px-2.5 py-2.5 transition-all duration-200',
                isActive ? 'bg-gold-50 shadow-sm ring-1 ring-gold-200/70' : 'hover:bg-slate-50 active:bg-slate-100',
              ].join(' ')}
            >
              {h.level === 2 ? (
                <span
                  className={[
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                    isActive
                      ? 'bg-gold-500 text-navy-900'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200',
                  ].join(' ')}
                >
                  {index + 1}
                </span>
              ) : (
                <ChevronRight
                  className={['mt-1 h-3.5 w-3.5 shrink-0', isActive ? 'text-gold-600' : 'text-slate-400'].join(' ')}
                  aria-hidden
                />
              )}
              <span
                className={[
                  'min-w-0 flex-1 leading-snug',
                  h.level === 2 ? 'text-sm' : 'text-[0.8125rem]',
                  isActive ? 'font-bold text-black' : 'font-medium text-neutral-800 group-hover:text-black',
                ].join(' ')}
              >
                {h.text}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );

  if (isMobile) {
    return (
      <nav
        aria-label="On this page"
        className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden"
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-[48px] w-full items-center justify-between gap-3 bg-gradient-to-r from-navy-900 to-navy-800 px-4 py-3.5 text-left"
          aria-expanded={open}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold-500/20">
              <BookOpen className="h-3.5 w-3.5 text-gold-300" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gold-300">
                On this page
              </span>
              {!open && activeLabel ? (
                <span className="mt-0.5 block truncate text-sm font-medium text-white/90">{activeLabel}</span>
              ) : null}
            </span>
          </span>
          <ChevronDown
            className={['h-5 w-5 shrink-0 text-gold-300 transition-transform duration-300', open ? 'rotate-180' : ''].join(
              ' '
            )}
            aria-hidden
          />
        </button>
        <div
          className={[
            'toc-panel grid transition-[grid-template-rows] duration-300 ease-out',
            open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          ].join(' ')}
        >
          <div className="overflow-hidden">
            <div className="toc-scroll-hide max-h-56 overflow-y-auto overscroll-contain border-t border-slate-100">
              {list}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="On this page"
      className="max-lg:hidden overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg ring-1 ring-black/[0.04]"
    >
      <div className="border-b border-navy-900/10 bg-gradient-to-r from-navy-900 to-navy-800 px-4 py-3.5">
        <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-500/20">
            <BookOpen className="h-3.5 w-3.5 text-gold-300" aria-hidden />
          </span>
          On this page
        </p>
        {activeIndex >= 0 ? (
          <p className="mt-1.5 truncate pl-9 text-xs text-blue-100/80">
            {activeIndex + 1} / {visibleHeadings.length} · {visibleHeadings[activeIndex]?.text}
          </p>
        ) : null}
      </div>
      <div className="toc-scroll-hide max-h-[min(70vh,28rem)] overflow-y-auto overscroll-contain">{list}</div>
    </nav>
  );
}
