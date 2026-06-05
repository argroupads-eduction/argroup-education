import type { CollectionBeforeChangeHook } from 'payload'

export const populatePublishedAt: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (req.context?.disablePublishedAtDefault) return data
  if (data?.publishedAt) return data

  if (operation === 'create' || operation === 'update') {
    if (req.data && !req.data.publishedAt) {
      const now = new Date()
      return {
        ...data,
        publishedAt: now,
      }
    }
  }

  return data
}
