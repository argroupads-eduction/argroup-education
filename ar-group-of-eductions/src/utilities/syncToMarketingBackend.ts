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
  /** First publish from draft → marketing site should Web Push subscribers. */
  notifyPush?: boolean
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
    // Apex domain rejects POST /api/cms/payload-sync (405). Always use www for marketing sync.
    if (url.hostname === 'argroupofeducation.com') {
      url.hostname = 'www.argroupofeducation.com'
    }
    return url.toString().replace(/\/$/, '')
  } catch {
    return raw.replace(/\/$/, '')
  }
}

function isLocalMarketingHost(base: string): boolean {
  try {
    const host = new URL(base).hostname
    return host === 'localhost' || host === '127.0.0.1' || host === '::1'
  } catch {
    return /localhost|127\.0\.0\.1/i.test(base)
  }
}

async function postMarketingSync(
  endpoint: string,
  secret: string,
  payload: SyncPayload,
): Promise<void> {
  const onVercel = process.env.VERCEL === '1'
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(payload),
    // Local CMS: fail fast. Vercel: keep under Hobby 60s.
    signal: AbortSignal.timeout(onVercel ? 18_000 : 12_000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `[payload→backend sync] ${res.status} from ${endpoint}: ${text.slice(0, 300)}`,
    )
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

  if (process.env.VERCEL === '1' && isLocalMarketingHost(base)) {
    const msg =
      `[payload→backend sync] BACKEND_API_URL/FRONTEND_APP_URL points at ${base} — Vercel CMS cannot reach localhost. ` +
      'Set BACKEND_API_URL=https://www.argroupofeducation.com'
    console.error(msg)
    throw new Error(msg)
  }

  const endpoint = `${base}/api/cms/payload-sync`
  // One quick retry only — never burn the whole serverless timeout.
  const attempts = process.env.VERCEL === '1' ? 2 : 3
  let lastErr: unknown

  for (let i = 1; i <= attempts; i++) {
    try {
      await postMarketingSync(endpoint, secret, payload)
      console.info('[payload→backend sync] ok', payload.type, payload.slug, '→', endpoint, `attempt=${i}`)
      return
    } catch (err) {
      lastErr = err
      console.error(
        '[payload→backend sync] attempt failed',
        { attempt: i, slug: payload.slug, err: err instanceof Error ? err.message : String(err) },
      )
      if (i < attempts) {
        await new Promise((r) => setTimeout(r, 400 * i))
      }
    }
  }

  if (lastErr instanceof Error && lastErr.message.startsWith('[payload→backend sync]')) {
    throw lastErr
  }
  throw new Error(
    `[payload→backend sync] Failed to reach ${endpoint}: ${
      lastErr instanceof Error ? lastErr.message : String(lastErr)
    }`,
  )
}
