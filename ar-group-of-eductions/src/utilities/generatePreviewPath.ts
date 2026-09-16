import { PayloadRequest, CollectionSlug } from 'payload'

const collectionPrefixMap: Partial<Record<CollectionSlug, string>> = {
  posts: '/blog',
  pages: '',
}

type Props = {
  collection: keyof typeof collectionPrefixMap
  slug: string
  req: PayloadRequest
}

export const generatePreviewPath = ({ collection, slug }: Props) => {
  if (slug === undefined || slug === null) {
    return null
  }

  // Encode to support slugs with special characters
  const encodedSlug = encodeURIComponent(slug)

  const relativePath =
    slug === 'home' ? '/' : `${collectionPrefixMap[collection]}/${encodedSlug}` || '/'

  const previewPath = relativePath
  const frontendAppURL = process.env.FRONTEND_APP_URL?.replace(/\/$/, '')

  if (!frontendAppURL) {
    return previewPath
  }

  return `${frontendAppURL}${previewPath}`
}
