import dotenv from 'dotenv'
import pg from 'pg'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: path.join(root, '.env') })
dotenv.config({ path: path.join(root, '.env.local') })

const secret = (process.env.REVALIDATE_SECRET || process.env.PAYLOAD_SYNC_SECRET || '')
  .trim()
  .replace(/\r$/, '')
if (!secret) {
  console.error('No sync secret')
  process.exit(1)
}

const raw = process.env.DATABASE_URL.trim().replace(/^["']|["']$/g, '')
const c = new pg.Client({
  connectionString: raw.replace(/[?&]sslmode=[^&]*/gi, ''),
  ssl: { rejectUnauthorized: false },
})
await c.connect()

const slugs = [
  'first-pavlov-state-medical-university-of-st-petersburg',
  'kursk-state-medical-university',
  'md-vs-ms-vs-dnb-vs-pg-diploma',
  'md-ms-admission-through-management-and-nri-quota',
  'neet-pg-2026-exam-date',
  'md-ms-management-quota-admission',
  'best-md-ms-college-in-india',
  'best-courses-after-mbbs-in-india',
  'neet-pg-counselling-process',
  'difference-between-md-and-ms-specialization',
  'mdms-admission-in-india',
  'neet-pg',
]

const base = 'https://www.argroupofeducation.com'

for (const slug of slugs) {
  const r = await c.query(
    `SELECT id, title, slug, html_content, featured_image_url, meta_title, meta_description, published_at, _status, schema_json
     FROM cms.posts AS OF SYSTEM TIME '-1s' WHERE slug = $1`,
    [slug],
  )
  const p = r.rows[0]
  if (!p?.schema_json) {
    console.log(slug, 'NO SCHEMA')
    continue
  }
  const body = {
    type: 'post',
    slug: p.slug,
    title: p.title || p.slug,
    content: p.html_content || p.title || '',
    featuredImage: p.featured_image_url || null,
    metaTitle: p.meta_title,
    metaDescription: p.meta_description,
    schemaJson: p.schema_json,
    published: p._status === 'published',
    publishedAt: p.published_at,
    category: 'Blog',
    pullFromCms: false,
  }
  const res = await fetch(`${base}/api/cms/payload-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  })
  console.log(slug, 'prod', res.status)
}

await c.end()
