import 'dotenv/config'
process.env.PAYLOAD_DATABASE_PUSH = 'false'

import { getPayload } from 'payload'
import config from '@payload-config'

async function main() {
  const payload = await getPayload({ config })

  const [posts, pages, media, header] = await Promise.all([
    payload.find({ collection: 'posts', limit: 0, depth: 0 }),
    payload.find({ collection: 'pages', limit: 0, depth: 0 }),
    payload.find({ collection: 'media', limit: 0, depth: 0 }),
    payload.findGlobal({ slug: 'header', depth: 0 }).catch(() => null),
  ])

  const menuItems = (header as { menuItems?: unknown[] } | null)?.menuItems
  const quickPick = (header as { quickPickPages?: unknown[] } | null)?.quickPickPages

  console.log('=== Payload CMS counts ===')
  console.log(`Posts:  ${posts.totalDocs} (expected ~269)`)
  console.log(`Pages:  ${pages.totalDocs} (expected ~358)`)
  console.log(`Media:  ${media.totalDocs} (expected hundreds)`)
  console.log(
    `Menu:   ${Array.isArray(menuItems) ? menuItems.length : 0} top-level items` +
      (Array.isArray(quickPick) ? `, quickPick=${quickPick.length}` : '')
  )

  if (posts.totalDocs > 0) {
    const recent = await payload.find({
      collection: 'posts',
      limit: 3,
      depth: 0,
      sort: '-publishedAt',
      select: { title: true, slug: true, publishedAt: true },
    })
    console.log('\nLatest posts:')
    for (const p of recent.docs) {
      console.log(`  - ${p.slug} (${p.publishedAt ?? 'no date'})`)
    }
  }

  if (pages.totalDocs > 0) {
    const recent = await payload.find({
      collection: 'pages',
      limit: 3,
      depth: 0,
      sort: '-publishedAt',
      select: { title: true, slug: true, publishedAt: true },
    })
    console.log('\nLatest pages:')
    for (const p of recent.docs) {
      console.log(`  - ${p.slug}`)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
