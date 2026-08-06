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

  // Re-load with depth so Lexical body + heroImage media URLs are present for HTML sync.
  let syncDoc: Post = doc
  try {
    if (doc.id != null) {
      syncDoc = (await req.payload.findByID({
        collection: 'posts',
        id: doc.id,
        depth: 2,
        draft: false,
        overrideAccess: true,
      })) as Post
    }
  } catch (err) {
    req.payload.logger.warn(
      { err, id: doc.id },
      '[payload→backend sync] findByID failed — falling back to hook doc',
    )
  }

  const fields = await buildPostSyncPayload(req.payload, syncDoc)
  const title = syncDoc.title ?? doc.title ?? doc.slug ?? 'Untitled'
  const contentLooksThin =
    !fields.content?.trim() ||
    fields.content.trim() === title.trim() ||
    fields.content.trim().length < 200

  if (contentLooksThin || !fields.featuredImage) {
    req.payload.logger.warn(
      {
        slug: syncDoc.slug ?? doc.slug,
        contentLen: fields.content?.length ?? 0,
        hasImage: Boolean(fields.featuredImage),
        hint: 'Publish may sync incomplete post — check Content tab heroImage + Article content, then Publish again.',
      },
      '[payload→backend sync] thin content or missing featured image',
    )
  }

  const syncBody = {
    type: 'post' as const,
    slug: syncDoc.slug ?? doc.slug ?? '',
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
    publishedAt: syncDoc.publishedAt ?? doc.publishedAt ?? null,
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
