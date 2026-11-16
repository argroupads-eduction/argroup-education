'use client';

import { useEffect } from 'react';

const RELOAD_KEY = 'ar-global-error-reload-v1';

export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#fff',
          color: '#1a365d',
        }}
      >
        <div style={{ textAlign: 'center', padding: 24, maxWidth: 420 }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: '#475569', marginBottom: 16 }}>
            Please reload the page. If this keeps happening, clear the site cache and try again.
          </p>
          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.removeItem(RELOAD_KEY);
              } catch {
                /* ignore */
              }
              reset();
            }}
            style={{
              border: 0,
              borderRadius: 999,
              padding: '10px 18px',
              background: '#1a365d',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
