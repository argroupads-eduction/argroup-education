import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Post } from '../../../payload-types'
import { htmlFromPayloadDoc, syncToMarketingBackend } from '../../../utilities/syncToMarketingBackend'

export const syncPostToBackend: CollectionAfterChangeHook<Post> = ({ doc, previousDoc, req }) => {
  if (req.context?.disableBackendSync) return doc

  const isPublished = doc._status === 'published'
  const wasPublished = previousDoc?._status === 'published'
  if (!isPublished && !wasPublished) return doc

  const html = htmlFromPayloadDoc(doc)
  const published = isPublished

  void syncToMarketingBackend({
    type: 'post',
    slug: doc.slug ?? '',
    title: doc.title ?? doc.slug ?? 'Untitled',
    content: html || doc.meta?.description || doc.title || '',
    excerpt: doc.meta?.description ?? null,
    featuredImage:
      typeof doc.featuredImageUrl === 'string'
        ? doc.featuredImageUrl
        : typeof doc.meta?.image === 'object' && doc.meta.image && 'url' in doc.meta.image
          ? String(doc.meta.image.url ?? '')
          : null,
    category: 'Blog',
    metaTitle: doc.meta?.title ?? null,
    metaDescription: doc.meta?.description ?? null,
    published,
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
