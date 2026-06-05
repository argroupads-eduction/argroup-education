import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Post } from '../../../payload-types'

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path)
  } catch {
    /* no-op outside Next.js (bulk import scripts) */
  }
}

function safeRevalidateTag(tag: string) {
  try {
    revalidateTag(tag, 'max')
  } catch {
    /* no-op outside Next.js */
  }
}

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = `/posts/${doc.slug}`

      payload.logger.info(`Revalidating post at path: ${path}`)

      safeRevalidatePath(path)
      safeRevalidateTag('posts-sitemap')
    }

    if (previousDoc._status === 'published' && doc._status !== 'published') {
      const oldPath = `/posts/${previousDoc.slug}`

      payload.logger.info(`Revalidating old post at path: ${oldPath}`)

      safeRevalidatePath(oldPath)
      safeRevalidateTag('posts-sitemap')
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = `/posts/${doc?.slug}`

    safeRevalidatePath(path)
    safeRevalidateTag('posts-sitemap')
  }

  return doc
}
