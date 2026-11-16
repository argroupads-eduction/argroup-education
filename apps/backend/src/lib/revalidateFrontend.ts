/**
 * Bust Vercel ISR cache after Payload → Neon sync so /blog updates without waiting for revalidate TTL.
 */
export async function revalidateFrontend(opts: {
  slug: string;
  type: 'post' | 'page';
}): Promise<void> {
  const base = (
    process.env.FRONTEND_REVALIDATE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ''
  ).replace(/\/$/, '');
  const secret = process.env.REVALIDATE_SECRET?.trim();
  if (!base || !secret) return;

  try {
    await fetch(`${base}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        slug: opts.slug,
        type: opts.type,
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    console.error('[revalidate frontend]', err);
  }
}
