/**
 * Remove duplicate Payload pages (same slug) — fixes React "duplicate key" in admin list.
 *
 * Usage: npx tsx scripts/dedupe-payload-pages.mts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

async function main() {
  const payload = await getPayload({ config })
  const all = await payload.find({
    collection: 'pages',
    limit: 500,
    pagination: false,
    depth: 0,
    sort: '-createdAt',
    select: { id: true, slug: true, title: true, createdAt: true },
  })

  const bySlug = new Map<string, typeof all.docs>()
  for (const doc of all.docs) {
    const slug = doc.slug?.trim()
    if (!slug) continue
    const list = bySlug.get(slug) ?? []
    list.push(doc)
    bySlug.set(slug, list)
  }

  let removed = 0
  for (const [slug, docs] of bySlug) {
    if (docs.length <= 1) continue
    const [keep, ...dupes] = docs
    console.log(`[dedupe] slug=${slug} keep id=${keep.id}, remove ${dupes.length} duplicate(s)`)
    for (const d of dupes) {
      await payload.delete({
        collection: 'pages',
        id: d.id,
        overrideAccess: true,
        context: { disableRevalidate: true, disableBackendSync: true },
      })
      removed++
    }
  }

  console.log(`[dedupe] Done. removed=${removed} total_pages=${all.docs.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
