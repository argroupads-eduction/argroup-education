import dotenv from 'dotenv'
import pg from 'pg'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(dir, '..', '.env') })
dotenv.config({ path: path.join(dir, '../../apps/backend/.env') })

const slug = process.argv[2] || 'suvbudfbvuhuysdbfuyefuyef'
const raw = process.env.DATABASE_URL?.trim()?.replace(/^["']|["']$/g, '')
const secret = (
  process.env.REVALIDATE_SECRET ||
  process.env.PAYLOAD_SYNC_SECRET ||
  ''
)
  .trim()
  .replace(/\r$/, '')

if (!raw) {
  console.error('no DATABASE_URL')
  process.exit(1)
}

const c = new pg.Client({
  connectionString: raw.replace(/[?&]sslmode=[^&]*/gi, ''),
  ssl: { rejectUnauthorized: false },
  statement_timeout: 20_000,
})
await c.connect()
await c.query("SET statement_timeout = '15s'")

const cms = await c.query(
  `SELECT id, title, slug, _status FROM cms.posts WHERE slug = $1 OR title = $1`,
  [slug],
)
console.log('cms_before', cms.rows)

if (cms.rows[0]) {
  await c.query(`UPDATE cms.posts SET _status = 'draft', updated_at = now() WHERE id = $1`, [
    cms.rows[0].id,
  ])
  console.log('cms_set_draft', cms.rows[0].id)
}

const del = await c.query(`DELETE FROM public."BlogPost" WHERE slug = $1 RETURNING id, slug`, [
  slug,
])
console.log('cockroach_BlogPost_deleted', del.rows)

await c.end()

const body = {
  type: 'post',
  slug,
  title: slug,
  content: '',
  published: false,
  pullFromCms: false,
}

const targets = [
  'https://www.argroupofeducation.com',
  'http://localhost:3000',
  'http://localhost:3001',
]

if (!secret) {
  console.error('no sync secret — live unpublish via API skipped; CMS draft + CRDB BlogPost done')
  process.exit(0)
}

for (const base of targets) {
  try {
    const res = await fetch(`${base}/api/cms/payload-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25_000),
    })
    const text = await res.text()
    console.log(base, res.status, text.slice(0, 200))
  } catch (e) {
    console.log(base, 'ERR', e instanceof Error ? e.message : String(e))
  }
}
