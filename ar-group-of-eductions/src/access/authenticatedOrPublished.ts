import type { Access } from 'payload'

export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) {
    return true
  }

  // Local preview helper: allows frontend draft preview without CMS login cookies.
  if (process.env.ALLOW_PUBLIC_DRAFT_PREVIEW === 'true') {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
