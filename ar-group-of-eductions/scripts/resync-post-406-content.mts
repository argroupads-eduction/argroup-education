/**
 * Re-sync post 406 with Lexical→HTML so live blog body is not empty.
 * Usage: npx tsx scripts/resync-post-406-content.mts
 */
import { getPayload } from 'payload'
import config from '../src/payload.config.ts'
import { buildPostSyncPayload } from '../src/utilities/payloadSyncFields.ts'
import { syncToMarketingBackend } from '../src/utilities/syncToMarketingBackend.ts'

const POST_ID = 406

const payload = await getPayload({ config })
const doc = await payload.findByID({
  collection: 'posts',
  id: POST_ID,
  depth: 2,
  draft: false,
  overrideAccess: true,
})

if (!doc?.slug) {
  console.error('post missing', POST_ID)
  process.exit(1)
}

const fields = await buildPostSyncPayload(payload, doc)
console.log({
  slug: doc.slug,
  title: doc.title,
  status: doc._status,
  contentLen: (fields.content || '').length,
  excerptLen: (fields.excerpt || '').length,
  featured: Boolean(fields.featuredImage),
  preview: String(fields.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160),
})

if ((fields.content || '').trim().length < 200) {
  console.error('Converted HTML still too thin — aborting')
  process.exit(1)
}

await syncToMarketingBackend({
  type: 'post',
  slug: String(doc.slug),
  title: String(doc.title || doc.slug),
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
  published: doc._status === 'published',
  publishedAt: typeof doc.publishedAt === 'string' ? doc.publishedAt : doc.publishedAt?.toISOString?.() ?? null,
  notifyPush: false,
})

console.log('synced OK →', process.env.BACKEND_API_URL || process.env.FRONTEND_APP_URL)
process.exit(0)
