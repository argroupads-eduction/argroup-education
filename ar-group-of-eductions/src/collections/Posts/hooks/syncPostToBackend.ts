import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Post } from '../../../payload-types'
import { buildPostSyncPayload } from '../../../utilities/payloadSyncFields'
import {
  enqueueMarketingContentSync,
  isAutosaveRequest,
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

  enqueueMarketingContentSync(req, {
    type: 'post',
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
  })

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
