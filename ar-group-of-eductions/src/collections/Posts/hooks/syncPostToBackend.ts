import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Post } from '../../../payload-types'
import { buildPostSyncPayload } from '../../../utilities/payloadSyncFields'
import { isAutosaveRequest } from '../../../utilities/enqueueMarketingContentSync'
import { deferAfterResponse } from '../../../utilities/deferAfterResponse'
import { htmlFromPayloadDoc, syncToMarketingBackend } from '../../../utilities/syncToMarketingBackend'

type SyncFields = Awaited<ReturnType<typeof buildPostSyncPayload>>

function contentScore(fields: SyncFields, title: string): number {
  const c = (fields.content || '').trim()
  if (!c) return 0
  if (c === title.trim()) return 1
  return c.length
}

function pickRicherFields(a: SyncFields, b: SyncFields, title: string): SyncFields {
  const useB = contentScore(b, title) > contentScore(a, title)
  const base = useB ? b : a
  const other = useB ? a : b
  return {
    ...base,
    featuredImage: base.featuredImage || other.featuredImage || null,
    ogImage: base.ogImage || other.ogImage || base.featuredImage || other.featuredImage || null,
    excerpt: base.excerpt?.trim() || other.excerpt || base.excerpt,
  }
}

async function loadPostViaLocalRest(id: string | number): Promise<Post | null> {
  const base = (
    process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.PAYLOAD_PUBLIC_SERVER_URL ||
    ''
  ).replace(/\/$/, '')
  if (!base || base.includes('localhost')) return null

  try {
    const res = await fetch(`${base}/api/posts/${id}?depth=2`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) return null
    const json = (await res.json()) as Post
    return json?.id != null ? json : null
  } catch {
    return null
  }
}

/**
 * Publish must return immediately. Heavy enrichment + marketing HTTP used to run
 * inside afterChange and left the admin stuck on "Submitting...".
 */
export const syncPostToBackend: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (req.context?.disableBackendSync) return doc
  if (isAutosaveRequest(req)) return doc

  const isPublished = doc._status === 'published'
  const wasPublished = previousDoc?._status === 'published'
  if (!isPublished && !wasPublished) return doc

  const title =
    (typeof doc.title === 'string' && doc.title.trim()) ||
    (typeof previousDoc?.title === 'string' && previousDoc.title.trim()) ||
    doc.slug ||
    previousDoc?.slug ||
    'Untitled'
  const resolvedSlug =
    (typeof doc.slug === 'string' && doc.slug.trim()) ||
    (typeof previousDoc?.slug === 'string' && previousDoc.slug.trim()) ||
    ''

  if (!resolvedSlug) {
    req.payload.logger.error(
      { id: doc.id, status: doc._status },
      '[payload→backend sync] missing slug on publish — skipping live sync',
    )
    return doc
  }

  const prevSlug = typeof previousDoc?.slug === 'string' ? previousDoc.slug.trim() : ''
  const nextSlug = resolvedSlug
  const onVercel = process.env.VERCEL === '1'
  const payload = req.payload
  const docId = doc.id
  const publishedAt = doc.publishedAt ?? null
  const previousTitle = previousDoc?.title
  const previousPublishedAt = previousDoc?.publishedAt ?? null

  deferAfterResponse(async () => {
    // Prefer a fast snapshot. On Vercel, marketing pullFromCms reloads Lexical + hero
    // so we avoid extra Cockroach findByID calls that used to hang Publish.
    let fields = await buildPostSyncPayload(payload, doc)

    if (!onVercel && docId != null && contentScore(fields, title) < 200) {
      const restDoc = await loadPostViaLocalRest(docId)
      if (restDoc) {
        fields = pickRicherFields(fields, await buildPostSyncPayload(payload, restDoc), title)
      }
    }

    const syncBody = {
      type: 'post' as const,
      slug: resolvedSlug,
      title,
      content: fields.content,
      excerpt: fields.excerpt,
      featuredImage: fields.featuredImage,
      category: 'Blog',
      metaTitle: fields.metaTitle,
      metaDescription: fields.metaDescription,
      canonicalUrl: fields.canonicalUrl,
      focusKeyword: fields.focusKeyword,
      ogTitle: fields.ogTitle,
      ogDescription: fields.ogDescription,
      ogImage: fields.ogImage,
      twitterTitle: fields.twitterTitle,
      twitterDescription: fields.twitterDescription,
      schemaJson: fields.schemaJson,
      published: isPublished,
      publishedAt,
      notifyPush: Boolean(isPublished && !wasPublished),
      pullFromCms: onVercel,
    }

    if (prevSlug && nextSlug && prevSlug !== nextSlug) {
      await syncToMarketingBackend({
        type: 'post',
        slug: prevSlug,
        title: previousTitle ?? prevSlug,
        content: '',
        published: false,
        publishedAt: previousPublishedAt,
      })
    }

    await syncToMarketingBackend(syncBody)
    payload.logger.info(
      { slug: resolvedSlug, published: isPublished },
      '[payload→backend sync] background publish sync ok',
    )
  })

  return doc
}

export const syncPostDeleteToBackend: CollectionAfterDeleteHook<Post> = async ({ doc, req }) => {
  if (!doc?.slug) return doc

  try {
    await syncToMarketingBackend({
      type: 'post',
      slug: doc.slug,
      title: doc.title ?? doc.slug,
      content: htmlFromPayloadDoc(doc),
      published: false,
    })
  } catch (err) {
    req.payload.logger.error(
      {
        err,
        slug: doc.slug,
        hint: 'Post deleted in CMS but still on live DB — fix BACKEND_API_URL / REVALIDATE_SECRET.',
      },
      '[payload→backend sync] delete sync failed',
    )
  }

  return doc
}
