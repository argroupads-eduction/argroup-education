import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import type { Payload } from 'payload'

import { htmlFromPayloadDoc } from './lexicalToHtml'

type MediaDoc = {
  id?: number | string
  url?: string | null
  filename?: string | null
  mimeType?: string | null
  alt?: string | null
}

const mediaDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../public/media'
)

function payloadBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, '') ||
    process.env.PAYLOAD_PUBLIC_URL?.replace(/\/$/, '') ||
    'http://localhost:8000'
  )
}

function isPublicHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return (
      u.protocol === 'https:' &&
      !u.hostname.includes('localhost') &&
      u.hostname !== '127.0.0.1'
    )
  } catch {
    return false
  }
}

function mediaUrlFromDoc(media: MediaDoc | null | undefined): string | null {
  if (!media?.url) return null
  if (/^https?:\/\//i.test(media.url)) return media.url
  const base = payloadBaseUrl()
  return `${base}${media.url.startsWith('/') ? media.url : `/${media.url}`}`
}

async function mediaDocToDataUrl(media: MediaDoc): Promise<string | null> {
  const filename = media.filename?.trim()
  if (!filename) return null
  const filePath = path.join(mediaDir, filename)
  if (!fs.existsSync(filePath)) return null
  const buf = await fs.promises.readFile(filePath)
  const mime = media.mimeType?.trim() || 'image/png'
  return `data:${mime};base64,${buf.toString('base64')}`
}

async function resolveMediaId(
  payload: Payload,
  ref: unknown
): Promise<MediaDoc | null> {
  if (!ref) return null
  if (typeof ref === 'object' && ref !== null && 'url' in ref) {
    return ref as MediaDoc
  }
  const id =
    typeof ref === 'string' || typeof ref === 'number'
      ? ref
      : typeof ref === 'object' && ref !== null && 'id' in ref
        ? (ref as { id: string | number }).id
        : null
  if (id == null) return null
  try {
    return (await payload.findByID({
      collection: 'media',
      id,
      depth: 0,
    })) as MediaDoc
  } catch {
    return null
  }
}

/** Featured image URL safe for Vercel (embeds local Payload uploads as data URLs). */
export async function resolveFeaturedImageForSync(
  payload: Payload,
  doc: {
    featuredImage?: unknown
    featuredImageUrl?: string | null
    heroImage?: unknown
    hero?: { media?: unknown } | null
    meta?: { image?: unknown } | null
  }
): Promise<string | null> {
  for (const ref of [doc.featuredImage, doc.heroImage, doc.hero?.media, doc.meta?.image]) {
    const media = await resolveMediaId(payload, ref)
    if (!media) continue

    const url = mediaUrlFromDoc(media)
    if (url && isPublicHttpsUrl(url)) return url

    const dataUrl = await mediaDocToDataUrl(media)
    if (dataUrl) return dataUrl

    if (url) return url
  }

  if (typeof doc.featuredImageUrl === 'string' && doc.featuredImageUrl.trim()) {
    return doc.featuredImageUrl.trim()
  }

  return null
}

export async function buildPostSyncPayload(
  payload: Payload,
  doc: {
    slug?: string | null
    title?: string | null
    htmlContent?: string | null
    content?: unknown
    layout?: unknown
    hero?: { richText?: unknown; media?: unknown } | null
    meta?: { title?: string | null; description?: string | null; image?: unknown } | null
    featuredImage?: unknown
    featuredImageUrl?: string | null
    heroImage?: unknown
    sitePlacement?: {
      showInNavigation?: boolean | null
      navSection?: string | null
      navParent?: string | null
      navLabel?: string | null
      navSortOrder?: number | null
    } | null
    canonicalUrl?: string | null
    focusKeyword?: string | null
    ogImageUrl?: string | null
    schemaJson?: unknown | null
    publishedAt?: string | null
    _status?: string | null
  }
) {
  const html = htmlFromPayloadDoc(doc)
  const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const excerpt =
    (typeof doc.meta?.description === 'string' && doc.meta.description.trim()) ||
    plain.slice(0, 500)

  const featuredImage = await resolveFeaturedImageForSync(payload, doc)
  const ogImageUrl =
    (typeof doc.ogImageUrl === 'string' && doc.ogImageUrl.trim()) || featuredImage

  const placement = doc.sitePlacement
  const metaTitle = doc.meta?.title ?? null
  const metaDescription = doc.meta?.description ?? null

  return {
    content: html || excerpt || doc.title || '',
    excerpt,
    featuredImage,
    metaTitle,
    metaDescription,
    canonicalUrl: typeof doc.canonicalUrl === 'string' ? doc.canonicalUrl : null,
    focusKeyword: typeof doc.focusKeyword === 'string' ? doc.focusKeyword : null,
    ogTitle: metaTitle,
    ogDescription: metaDescription,
    ogImage: ogImageUrl,
    twitterTitle: metaTitle,
    twitterDescription: metaDescription,
    schemaJson: doc.schemaJson ?? null,
    navEnabled: Boolean(placement?.showInNavigation),
    navSection: placement?.navSection ?? null,
    navParent: placement?.navParent ?? null,
    navLabel: placement?.navLabel ?? null,
    navSortOrder: placement?.navSortOrder ?? 0,
  }
}
