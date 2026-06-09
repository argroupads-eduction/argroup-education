'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type LazySectionProps = {
  children: ReactNode;
  /** Reserve space before content mounts (reduces layout shift). */
  minHeight?: string;
  rootMargin?: string;
  className?: string;
};

/** Mount children only when near the viewport, defers heavy section JS & images. */
export function LazySection({
  children,
  minHeight,
  rootMargin = '280px 0px',
  className,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={ref}
      className={className}
      style={!visible && minHeight ? { minHeight } : undefined}
    >
      {visible ? children : null}
    </div>
  );
}
