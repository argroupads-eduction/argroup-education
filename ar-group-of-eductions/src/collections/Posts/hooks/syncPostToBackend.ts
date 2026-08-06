import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Post } from '../../../payload-types'
import { buildPostSyncPayload } from '../../../utilities/payloadSyncFields'
import {
  isAutosaveRequest,
  syncMarketingContentAndWait,
} from '../../../utilities/enqueueMarketingContentSync'
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

async function loadPostForSync(
  req: Parameters<CollectionAfterChangeHook<Post>>[0]['req'],
  id: string | number,
  draft: boolean,
): Promise<Post | null> {
  try {
    return (await req.payload.findByID({
      collection: 'posts',
      id,
      depth: 2,
      draft,
      overrideAccess: true,
    })) as Post
  } catch {
    return null
  }
}

/** Last resort: CMS HTTP API often has fully populated Lexical + Blob media URLs. */
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
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return null
    const json = (await res.json()) as Post
    return json?.id != null ? json : null
  } catch {
    return null
  }
}

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

  const title = doc.title ?? doc.slug ?? 'Untitled'
  let fields = await buildPostSyncPayload(req.payload, doc)

  // Drafts + autosave: hook doc or draft:false snapshot can miss Lexical/media.
  // Merge hook + draft + published (+ REST) and keep the richest payload.
  if (doc.id != null) {
    const draftDoc = await loadPostForSync(req, doc.id, true)
    if (draftDoc) {
      fields = pickRicherFields(fields, await buildPostSyncPayload(req.payload, draftDoc), title)
    }

    const publishedDoc = await loadPostForSync(req, doc.id, false)
    if (publishedDoc) {
      fields = pickRicherFields(fields, await buildPostSyncPayload(req.payload, publishedDoc), title)
    }

    const stillThin =
      contentScore(fields, title) < 200 || !fields.featuredImage
    if (stillThin) {
      const restDoc = await loadPostViaLocalRest(doc.id)
      if (restDoc) {
        fields = pickRicherFields(fields, await buildPostSyncPayload(req.payload, restDoc), title)
      }
    }
  }

  const contentLooksThin = contentScore(fields, title) < 200

  if (contentLooksThin || !fields.featuredImage) {
    req.payload.logger.warn(
      {
        slug: doc.slug,
        contentLen: fields.content?.length ?? 0,
        hasImage: Boolean(fields.featuredImage),
        hint: 'Could not resolve full article HTML/image for marketing sync.',
      },
      '[payload→backend sync] thin content or missing featured image after merge',
    )
  }

  // Do not push title-only rows to live — keeps Neon from storing empty shells.
  if (contentLooksThin && !fields.featuredImage) {
    req.payload.logger.error(
      { slug: doc.slug },
      '[payload→backend sync] skipped thin publish sync (no body + no image)',
    )
    return doc
  }

  const syncBody = {
    type: 'post' as const,
    slug: doc.slug ?? '',
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
    publishedAt: doc.publishedAt ?? null,
    notifyPush: Boolean(isPublished && !wasPublished),
  }

  try {
    await syncMarketingContentAndWait(req, syncBody)
  } catch (err) {
    req.payload.logger.error(
      {
        err,
        slug: syncBody.slug,
        contentLen: syncBody.content?.length ?? 0,
        hasImage: Boolean(syncBody.featuredImage),
        hint: 'Set CMS BACKEND_API_URL=https://www.argroupofeducation.com and match REVALIDATE_SECRET with Amplify/live site.',
      },
      '[payload→backend sync] publish sync failed — post saved in CMS but not on live site yet',
    )
  }

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
        hint: 'Post deleted in CMS but still on live DB — delete BlogPost row in Supabase or fix BACKEND_API_URL / REVALIDATE_SECRET.',
      },
      '[payload→backend sync] delete sync failed',
    )
  }

  return doc
}
