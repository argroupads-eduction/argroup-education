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
  statement_timeout: 30_000,
})
await c.connect()
await c.query("SET statement_timeout = '25s'")

async function count(label, sql) {
  const started = Date.now()
  try {
    const r = await c.query(sql)
    console.log(label, r.rows[0], `${Date.now() - started}ms`)
  } catch (e) {
    console.log(label, 'ERROR', e.message, `${Date.now() - started}ms`)
  }
}

await count('cms.posts', 'SELECT count(*)::int AS n FROM cms.posts')
await count('cms.pages', 'SELECT count(*)::int AS n FROM cms.pages')
await count('cms.media', 'SELECT count(*)::int AS n FROM cms.media')
await count('BlogPost', 'SELECT count(*)::int AS n FROM public."BlogPost"')
await c.end()
