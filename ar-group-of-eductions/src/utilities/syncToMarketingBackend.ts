/**
 * Push published Payload docs to marketing backend (Neon neondb) so
 * localhost:3000 / production show blogs even when Payload CMS is offline.
 */

export { htmlFromPayloadDoc, lexicalToHtml } from './lexicalToHtml'
export { buildPostSyncPayload, resolveFeaturedImageForSync } from './payloadSyncFields'

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
  canonicalUrl?: string | null
  focusKeyword?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  ogImage?: string | null
  twitterTitle?: string | null
  twitterDescription?: string | null
  schemaJson?: unknown | null
  navEnabled?: boolean
  navSection?: string | null
  navParent?: string | null
  navLabel?: string | null
  navSortOrder?: number
  published: boolean
  publishedAt?: string | null
}

function resolveMarketingSyncBaseUrl(): string {
  const raw =
    process.env.BACKEND_API_URL?.trim() ||
    process.env.FRONTEND_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    ''

  if (!raw) return ''

  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    return url.toString().replace(/\/$/, '')
  } catch {
    return raw.replace(/\/$/, '')
  }
}

export async function syncToMarketingBackend(payload: SyncPayload): Promise<void> {
  const base = resolveMarketingSyncBaseUrl()
  const secret = (
    process.env.REVALIDATE_SECRET?.trim() ||
    process.env.PAYLOAD_SYNC_SECRET?.trim()
  )?.replace(/\r$/, '')

  if (!base || !secret) {
    const msg =
      '[payload→backend sync] Missing BACKEND_API_URL (or FRONTEND_APP_URL) and/or REVALIDATE_SECRET. ' +
      'On Vercel CMS set BACKEND_API_URL=https://www.argroupofeducation.com and the same REVALIDATE_SECRET as the marketing frontend.'
    console.error(msg)
    throw new Error(msg)
  }

  const endpoint = `${base}/api/cms/payload-sync`

  try {
    const res = await fetch(endpoint, {
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
      const msg = `[payload→backend sync] ${res.status} from ${endpoint}: ${text.slice(0, 300)}`
      console.error(msg)
      throw new Error(msg)
    }
    console.info('[payload→backend sync] ok', payload.type, payload.slug, '→', endpoint)
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('[payload→backend sync]')) {
      throw err
    }
    const msg = `[payload→backend sync] Failed to reach ${endpoint}: ${err instanceof Error ? err.message : String(err)}`
    console.error(msg)
    throw new Error(msg)
  }
}
