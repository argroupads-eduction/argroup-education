import dotenv from 'dotenv'
import pg from 'pg'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(dir, '..', '.env') })

const raw = process.env.DATABASE_URL?.trim()?.replace(/^["']|["']$/g, '')
const c = new pg.Client({
  connectionString: raw.replace(/[?&]sslmode=[^&]*/gi, ''),
  ssl: { rejectUnauthorized: true },
  connectionTimeoutMillis: 10_000,
  statement_timeout: 20_000,
})
await c.connect()
await c.query("SET statement_timeout = '15s'")

async function run(label, sql) {
  try {
    const r = await c.query(sql)
    console.log('\n==', label, '==')
    console.log(JSON.stringify(r.rows, null, 2))
  } catch (e) {
    console.log('\n==', label, 'ERR ==', e.message)
  }
}

await run('posts_378', `SELECT id, title, slug, _status, updated_at FROM cms.posts WHERE id = 378`)
await run(
  'versions_378',
  `SELECT id, parent_id, version_title, version_slug, version__status, latest, autosave, updated_at
   FROM cms._posts_v WHERE parent_id = 378 ORDER BY id DESC LIMIT 10`,
)
await run(
  'any_version_title',
  `SELECT id, parent_id, version_title, version_slug, version__status, updated_at
   FROM cms._posts_v WHERE parent_id = 378 OR id = 378 ORDER BY updated_at DESC LIMIT 5`,
)
await run(
  'blogpost_guess',
  `SELECT id, slug, title, "published", "updatedAt"
   FROM public."BlogPost"
   WHERE slug ILIKE '%378%' OR title ILIKE '%378%'
   ORDER BY "updatedAt" DESC LIMIT 5`,
)
await run(
  'max_post_id',
  `SELECT max(id)::int AS max_id, count(*)::int AS n FROM cms.posts`,
)
await run(
  'jobs_mention_378',
  `SELECT id, task_slug, completed_at, has_error, left(COALESCE(input::text,''), 200) AS input
   FROM cms.payload_jobs
   WHERE input::text ILIKE '%378%'
   ORDER BY id DESC LIMIT 10`,
)

await c.end()
