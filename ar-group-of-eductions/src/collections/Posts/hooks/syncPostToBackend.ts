import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Post } from '../../../payload-types'
import { buildPostSyncPayload } from '../../../utilities/payloadSyncFields'
import {
  isAutosaveRequest,
  syncMarketingContentAndWait,
} from '../../../utilities/enqueueMarketingContentSync'
import { htmlFromPayloadDoc, syncToMarketingBackend } from '../../../utilities/syncToMarketingBackend'

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

  const fields = await buildPostSyncPayload(req.payload, doc)

  const syncBody = {
    type: 'post' as const,
    slug: doc.slug ?? '',
    title: doc.title ?? doc.slug ?? 'Untitled',
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
    // First transition to published → marketing site sends Web Push to PWA subscribers.
    notifyPush: Boolean(isPublished && !wasPublished),
  }

  // Await sync so it finishes before the admin response, but never fail Publish
  // when marketing auth/URL is misconfigured (otherwise Payload shows "Something went wrong").
  try {
    await syncMarketingContentAndWait(req, syncBody)
  } catch (err) {
    req.payload.logger.error(
      {
        err,
        slug: syncBody.slug,
        hint: 'Set CMS BACKEND_API_URL=https://www.argroupofeducation.com and match REVALIDATE_SECRET with Amplify/live site.',
      },
      '[payload→backend sync] publish sync failed — post saved in CMS but not on live site yet',
    )
  }

  return doc
}

export const syncPostDeleteToBackend: CollectionAfterDeleteHook<Post> = ({ doc }) => {
  if (!doc?.slug) return doc

  void syncToMarketingBackend({
    type: 'post',
    slug: doc.slug,
    title: doc.title ?? doc.slug,
    content: htmlFromPayloadDoc(doc),
    published: false,
  })

  return doc
}
