'use client';

import { useEffect } from 'react';

const RELOAD_KEY = 'ar-route-error-reload-v1';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const msg = error?.message ?? '';
    const isChunk =
      /Loading chunk/i.test(msg) ||
      /ChunkLoadError/i.test(msg) ||
      /Failed to fetch dynamically imported module/i.test(msg);

    if (!isChunk) return;

    try {
      if (sessionStorage.getItem(RELOAD_KEY) === '1') return;
      sessionStorage.setItem(RELOAD_KEY, '1');
    } catch {
      /* ignore */
    }
    window.location.reload();
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-xl font-semibold text-navy-900">Something went wrong</h1>
      <p className="text-sm text-slate-600">
        The page failed to load. This often happens right after a deploy — try again.
      </p>
      <button
        type="button"
        className="ui-btn ui-btn--navy ui-btn--pill ui-btn--md"
        onClick={() => {
          try {
            sessionStorage.removeItem(RELOAD_KEY);
          } catch {
            /* ignore */
          }
          reset();
        }}
      >
        Try again
      </button>
    </div>
  );
}
