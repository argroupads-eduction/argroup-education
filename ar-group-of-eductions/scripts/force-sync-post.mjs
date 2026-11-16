import dotenv from 'dotenv'
import pg from 'pg'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(dir, '..', '.env') })

const raw = process.env.DATABASE_URL?.trim()?.replace(/^["']|["']$/g, '')
const secret = (
  process.env.REVALIDATE_SECRET ||
  process.env.PAYLOAD_SYNC_SECRET ||
  ''
)
  .trim()
  .replace(/\r$/, '')

if (!secret) {
  console.error('missing REVALIDATE_SECRET / PAYLOAD_SYNC_SECRET in CMS .env')
  process.exit(1)
}

const c = new pg.Client({
  connectionString: raw.replace(/[?&]sslmode=[^&]*/gi, ''),
  ssl: { rejectUnauthorized: true },
  statement_timeout: 20_000,
})
await c.connect()
await c.query("SET statement_timeout = '12s'")

const slug = process.argv[2] || 'suvbudfbvuhuysdbfuyefuyef'
const r = await c.query(
  `SELECT id, title, slug, _status, html_content, featured_image_url, meta_title, meta_description, published_at
   FROM cms.posts AS OF SYSTEM TIME '-1s'
   WHERE slug = $1 OR id::text = $1
   LIMIT 1`,
  [slug],
)
await c.end()

if (!r.rows[0]) {
  console.error('post not found', slug)
  process.exit(1)
}

const p = r.rows[0]
const body = {
  type: 'post',
  slug: p.slug,
  title: p.title || p.slug,
  content: p.html_content || p.title || '',
  featuredImage: p.featured_image_url || null,
  metaTitle: p.meta_title,
  metaDescription: p.meta_description,
  published: p._status === 'published',
  publishedAt: p.published_at,
  category: 'Blog',
  pullFromCms: false,
}

const bases = [
  'http://localhost:3001',
  'http://localhost:3000',
]

for (const base of bases) {
  const url = `${base}/api/cms/payload-sync`
  console.log('trying', { id: p.id, slug: p.slug, to: url })
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    })
    const text = await res.text()
    console.log('status', res.status, text.slice(0, 400))
    if (res.ok) process.exit(0)
  } catch (e) {
    console.log('ERR', e instanceof Error ? e.message : String(e))
  }
}
process.exit(1)
