/**
 * Push Payload globals → marketing backend (Neon) for live site header/footer/settings.
 */

export async function syncGlobalToMarketingBackend(
  slug: string,
  data: Record<string, unknown>
): Promise<void> {
  const base = (
    process.env.BACKEND_API_URL ||
    process.env.FRONTEND_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ''
  ).replace(/\/$/, '')
  const secret = process.env.PAYLOAD_SYNC_SECRET?.trim()

  if (!base || !secret) {
    console.error(
      '[payload→backend globals] Missing BACKEND_API_URL or PAYLOAD_SYNC_SECRET'
    )
    return
  }

  try {
    const res = await fetch(`${base}/api/cms/globals-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ slug, data }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[payload→backend globals]', slug, res.status, text.slice(0, 200))
      return
    }
    console.info('[payload→backend globals] ok', slug)
  } catch (err) {
    console.error('[payload→backend globals]', slug, err)
  }
}
