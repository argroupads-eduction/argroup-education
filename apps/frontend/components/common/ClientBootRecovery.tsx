'use client';

import { useEffect } from 'react';

const RELOAD_KEY = 'ar-chunk-recovery-v1';

function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return (
    /Loading chunk [\w-]+ failed/i.test(msg) ||
    /ChunkLoadError/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg)
  );
}

function reloadOnce(): void {
  try {
    if (sessionStorage.getItem(RELOAD_KEY) === '1') return;
    sessionStorage.setItem(RELOAD_KEY, '1');
  } catch {
    /* private mode — still try one reload */
  }
  const url = new URL(window.location.href);
  url.searchParams.set('_r', String(Date.now()));
  window.location.replace(url.toString());
}

/**
 * After Hostinger/standalone redeploys, browsers often keep an old document that
 * requests deleted `/_next/static/chunks/*` hashes. Next then shows
 * "Application error: a client-side exception…". One forced reload clears it.
 */
export function ClientBootRecovery() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.error) || isChunkLoadError(event.message)) {
        event.preventDefault();
        reloadOnce();
      }
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) {
        event.preventDefault();
        reloadOnce();
      }
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    // Clear the one-shot flag after a healthy boot so a later deploy can recover again.
    try {
      const t = window.setTimeout(() => sessionStorage.removeItem(RELOAD_KEY), 8000);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener('error', onError);
        window.removeEventListener('unhandledrejection', onRejection);
      };
    } catch {
      return () => {
        window.removeEventListener('error', onError);
        window.removeEventListener('unhandledrejection', onRejection);
      };
    }
  }, []);

  return null;
}
