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

const q = await c.query(`
  SELECT query_id::text AS id, start, left(query, 80) AS q
  FROM crdb_internal.cluster_queries
  WHERE user_name = 'argroup'
    AND query NOT ILIKE '%cluster_queries%'
    AND query NOT ILIKE '%CANCEL%'
`)
console.log('to_cancel', q.rows.length)
for (const row of q.rows) {
  try {
    await c.query(`CANCEL QUERY $1`, [row.id])
    console.log('cancelled', row.id, row.q)
  } catch (e) {
    console.log('cancel_fail', row.id, e.message)
  }
}

const left = await c.query(`
  SELECT count(*)::int AS n FROM crdb_internal.cluster_queries
  WHERE user_name = 'argroup'
`)
console.log('remaining_argroup_queries', left.rows[0])

try {
  const p = await c.query('SELECT count(*)::int AS n FROM cms.posts')
  console.log('posts_count_ok', p.rows[0])
} catch (e) {
  console.log('posts_still_bad', e.message)
}

await c.end()
