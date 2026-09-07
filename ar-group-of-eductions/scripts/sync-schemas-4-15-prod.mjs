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
    `SELECT p.id, p.title, p.slug, p.html_content, p.meta_title, p.meta_description,
            p.published_at, p._status, p.schema_json,
            COALESCE(NULLIF(TRIM(p.featured_image_url), ''), m_hero.url, m_meta.url) AS image_url
     FROM cms.posts AS OF SYSTEM TIME '-1s' p
     LEFT JOIN cms.media AS OF SYSTEM TIME '-1s' m_hero ON m_hero.id = p.hero_image_id
     LEFT JOIN cms.media AS OF SYSTEM TIME '-1s' m_meta ON m_meta.id = p.meta_image_id
     WHERE p.slug = $1`,
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
    ...(p.image_url ? { featuredImage: p.image_url, ogImage: p.image_url } : {}),
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
