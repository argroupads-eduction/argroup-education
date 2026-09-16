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

const base = 'https://www.argroupofeducation.com'

// All published posts that have a hero/media URL but marketing may be missing image
const rows = await c.query(`
  SELECT
    p.id,
    p.title,
    p.slug,
    p.html_content,
    p.meta_title,
    p.meta_description,
    p.published_at,
    p._status,
    p.schema_json,
    COALESCE(
      NULLIF(TRIM(p.featured_image_url), ''),
      m_hero.url,
      m_meta.url
    ) AS image_url
  FROM cms.posts p
  LEFT JOIN cms.media m_hero ON m_hero.id = p.hero_image_id
  LEFT JOIN cms.media m_meta ON m_meta.id = p.meta_image_id
  WHERE p._status = 'published'
    AND COALESCE(
      NULLIF(TRIM(p.featured_image_url), ''),
      m_hero.url,
      m_meta.url
    ) IS NOT NULL
  ORDER BY p.published_at DESC NULLS LAST
`)

console.log('candidates', rows.rowCount)

let ok = 0
let fail = 0
for (const p of rows.rows) {
  const body = {
    type: 'post',
    slug: p.slug,
    title: p.title || p.slug,
    content: p.html_content || p.title || '',
    featuredImage: p.image_url,
    ogImage: p.image_url,
    metaTitle: p.meta_title,
    metaDescription: p.meta_description,
    schemaJson: p.schema_json ?? undefined,
    published: true,
    publishedAt: p.published_at,
    category: 'Blog',
    pullFromCms: false,
    notifyPush: false,
  }
  try {
    const res = await fetch(`${base}/api/cms/payload-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    })
    if (res.ok) ok++
    else {
      fail++
      console.log('FAIL', p.slug, res.status, (await res.text()).slice(0, 120))
    }
  } catch (e) {
    fail++
    console.log('ERR', p.slug, e instanceof Error ? e.message : e)
  }
}

await c.end()
console.log(JSON.stringify({ ok, fail, total: rows.rowCount }))
