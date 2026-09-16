import dotenv from 'dotenv'
import pg from 'pg'
import fs from 'fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(dir, '..')
dotenv.config({ path: path.join(root, '.env') })
dotenv.config({ path: path.join(root, '.env.local') })

const schemaDir = path.resolve(
  root,
  '..',
  'backups',
  'blog-schemas-2026-09-07',
)
// Prefer D: backups if present
const alt = 'D:\\ARGROUP OF EDUCTION\\backups\\blog-schemas-2026-09-07'
const schemasRoot = fs.existsSync(alt) ? alt : schemaDir

/** Blogs #4–#15 from CMS list (skip 1–3). */
const SLUGS = [
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

const raw = process.env.DATABASE_URL?.trim()?.replace(/^["']|["']$/g, '')
if (!raw) {
  console.error('DATABASE_URL missing in CMS .env')
  process.exit(1)
}

const secret = (
  process.env.REVALIDATE_SECRET ||
  process.env.PAYLOAD_SYNC_SECRET ||
  ''
)
  .trim()
  .replace(/\r$/, '')

const isCockroach = /cockroach|crdb|verify-full|options=--cluster/i.test(raw)
const c = new pg.Client({
  connectionString: raw.replace(/[?&]sslmode=[^&]*/gi, ''),
  ssl: { rejectUnauthorized: false },
  statement_timeout: 60_000,
})

await c.connect()
await c.query("SET statement_timeout = '45s'")

const asOf = isCockroach ? " AS OF SYSTEM TIME '-1s'" : ''

console.log('schemasRoot', schemasRoot)
console.log('db', raw.replace(/:[^:@/]+@/, ':***@').slice(0, 100), 'cockroach=', isCockroach)

const results = []

for (const slug of SLUGS) {
  const file = path.join(schemasRoot, `${slug}.json`)
  if (!fs.existsSync(file)) {
    results.push({ slug, ok: false, error: 'schema file missing' })
    continue
  }
  const schema = JSON.parse(fs.readFileSync(file, 'utf8'))

  const found = await c.query(
    `SELECT id, title, slug, _status, schema_json IS NOT NULL AS had_schema
     FROM cms.posts${asOf}
     WHERE slug = $1
     LIMIT 1`,
    [slug],
  )
  if (!found.rows[0]) {
    results.push({ slug, ok: false, error: 'post not found in cms.posts' })
    continue
  }

  const id = found.rows[0].id
  await c.query(`UPDATE cms.posts SET schema_json = $1::jsonb, updated_at = NOW() WHERE id = $2`, [
    JSON.stringify(schema),
    id,
  ])

  // Latest draft/published version rows so admin UI shows schema
  const ver = await c.query(
    `UPDATE cms._posts_v
     SET version_schema_json = $1::jsonb
     WHERE parent_id = $2 AND latest = true
     RETURNING id`,
    [JSON.stringify(schema), id],
  )

  results.push({
    slug,
    ok: true,
    id,
    versionsUpdated: ver.rowCount,
    title: found.rows[0].title,
  })

  // Sync schema to marketing backend so live SEO picks it up
  if (secret) {
    const meta = await c.query(
      `SELECT p.title, p.slug, p.html_content, p.meta_title, p.meta_description, p.published_at, p._status,
              COALESCE(NULLIF(TRIM(p.featured_image_url), ''), m_hero.url, m_meta.url) AS image_url
       FROM cms.posts p
       LEFT JOIN cms.media m_hero ON m_hero.id = p.hero_image_id
       LEFT JOIN cms.media m_meta ON m_meta.id = p.meta_image_id
       WHERE p.id = $1`,
      [id],
    )
    const p = meta.rows[0]
    const body = {
      type: 'post',
      slug: p.slug,
      title: p.title || p.slug,
      content: p.html_content || p.title || '',
      ...(p.image_url ? { featuredImage: p.image_url, ogImage: p.image_url } : {}),
      metaTitle: p.meta_title,
      metaDescription: p.meta_description,
      schemaJson: schema,
      published: p._status === 'published',
      publishedAt: p.published_at,
      category: 'Blog',
      pullFromCms: false,
    }
    for (const base of [
      process.env.BACKEND_API_URL,
      process.env.FRONTEND_APP_URL,
      'https://www.argroupofeducation.com',
      'http://localhost:3000',
    ].filter(Boolean)) {
      try {
        const res = await fetch(`${String(base).replace(/\/$/, '')}/api/cms/payload-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${secret}`,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(25_000),
        })
        results[results.length - 1].sync = `${base}→${res.status}`
        if (res.ok) break
      } catch (e) {
        results[results.length - 1].sync = `ERR ${e instanceof Error ? e.message : e}`
      }
    }
  }
}

await c.end()
console.log(JSON.stringify(results, null, 2))
const failed = results.filter((r) => !r.ok)
process.exit(failed.length ? 1 : 0)
