/**
 * Push published Payload docs to marketing backend (Neon neondb) so
 * localhost:3000 / production show blogs even when Payload CMS is offline.
 */

type SyncPayload = {
  type: 'post' | 'page'
  slug: string
  title: string
  content: string
  excerpt?: string | null
  featuredImage?: string | null
  category?: string
  metaTitle?: string | null
  metaDescription?: string | null
  published: boolean
  publishedAt?: string | null
}

export async function syncToMarketingBackend(payload: SyncPayload): Promise<void> {
  const base = (
    process.env.BACKEND_API_URL ||
    process.env.FRONTEND_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ''
  ).replace(/\/$/, '')
  const secret = process.env.PAYLOAD_SYNC_SECRET?.trim()

  if (!base || !secret) {
    console.error(
      '[payload→backend sync] Missing BACKEND_API_URL or PAYLOAD_SYNC_SECRET. Set BACKEND_API_URL=https://argroup-education-frontend.vercel.app on production Payload.'
    )
    return
  }

  try {
    const res = await fetch(`${base}/api/cms/payload-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[payload→backend sync]', res.status, text.slice(0, 300))
      return
    }
    console.info('[payload→backend sync] ok', payload.type, payload.slug)
  } catch (err) {
    console.error('[payload→backend sync]', err)
  }
}

export function htmlFromPayloadDoc(doc: {
  htmlContent?: string | null
  content?: unknown
}): string {
  if (typeof doc.htmlContent === 'string' && doc.htmlContent.trim()) {
    return doc.htmlContent
  }
  return ''
}
