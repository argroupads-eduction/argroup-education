import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Page } from '../../../payload-types'
import { buildPostSyncPayload } from '../../../utilities/payloadSyncFields'
import { isAutosaveRequest } from '../../../utilities/enqueueMarketingContentSync'
import { deferAfterResponse } from '../../../utilities/deferAfterResponse'
import { htmlFromPayloadDoc, syncToMarketingBackend } from '../../../utilities/syncToMarketingBackend'

/**
 * Fire-and-forget on Publish — awaiting marketing sync on Vercel left admin on "Submitting...".
 */
export const syncPageToBackend: CollectionAfterChangeHook<Page> = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (req.context?.disableBackendSync) return doc
  if (isAutosaveRequest(req)) return doc

  const isPublished = doc._status === 'published'
  const wasPublished = previousDoc?._status === 'published'
  if (!isPublished && !wasPublished) return doc

  if (!doc.slug) {
    req.payload.logger.error(
      { id: doc.id, status: doc._status },
      '[payload→backend sync] missing page slug — skipping live sync',
    )
    return doc
  }

  const payload = req.payload
  const slug = doc.slug
  const title = doc.title ?? doc.slug ?? 'Untitled'
  const publishedAt = doc.publishedAt ?? null

  deferAfterResponse(async () => {
    const fields = await buildPostSyncPayload(payload, doc)
    await syncToMarketingBackend({
      type: 'page',
      slug,
      title,
      content: fields.content,
      excerpt: fields.excerpt,
      featuredImage: fields.featuredImage,
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
      navEnabled: fields.navEnabled,
      navSection: fields.navSection,
      navParent: fields.navParent,
      navLabel: fields.navLabel,
      navSortOrder: fields.navSortOrder,
      published: isPublished,
      publishedAt,
    })
    payload.logger.info({ slug, published: isPublished }, '[payload→backend sync] page background sync ok')
  })

  return doc
}

export const syncPageDeleteToBackend: CollectionAfterDeleteHook<Page> = async ({ doc, req }) => {
  if (!doc?.slug) return doc

  try {
    await syncToMarketingBackend({
      type: 'page',
      slug: doc.slug,
      title: doc.title ?? doc.slug,
      content: htmlFromPayloadDoc(doc),
      published: false,
    })
  } catch (err) {
    req.payload.logger.error(
      { err, slug: doc.slug },
      '[payload→backend sync] page delete sync failed',
    )
  }

  return doc
}
