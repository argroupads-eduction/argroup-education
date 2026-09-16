import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env'), override: true })

import { getPayload } from 'payload'
import config from '@payload-config'
import { wpHtmlToLexical } from '../src/utilities/wpHtmlToLexical.js'

const slug = process.argv[2] || 'top-medical-colleges-in-india'

const payload = await getPayload({ config })
const result = await payload.find({
  collection: 'posts',
  where: { slug: { equals: slug } },
  limit: 1,
  depth: 0,
})

const doc = result.docs[0]
if (!doc) {
  console.error('not found:', slug)
  process.exit(1)
}

const html = String(doc.htmlContent ?? '')
console.log('html chars:', html.length)

const lexical = await wpHtmlToLexical(html, payload.config, {
  featuredImageUrl: typeof doc.featuredImageUrl === 'string' ? doc.featuredImageUrl : null,
  title: typeof doc.title === 'string' ? doc.title : null,
})

try {
  await payload.update({
    collection: 'posts',
    id: doc.id,
    data: { content: lexical },
    overrideAccess: true,
    context: { disableBackendSync: true, disableRevalidate: true, disableLegacyHydration: true },
  })
  console.log('update ok')
} catch (e: unknown) {
  const err = e as { data?: { errors?: unknown }; message?: string }
  console.error(JSON.stringify(err?.data?.errors ?? err?.message ?? err, null, 2))
}
