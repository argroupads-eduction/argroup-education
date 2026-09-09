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

async function run(label, sql, params) {
  const t = Date.now()
  try {
    const r = await c.query(sql, params)
    console.log(label, 'ok', `${Date.now() - t}ms`, r.rows?.slice?.(0, 5) ?? r.rowCount)
  } catch (e) {
    console.log(label, 'ERR', `${Date.now() - t}ms`, e.message)
  }
}

await run('queries', `SELECT query_id::text, start, left(query,100) q FROM crdb_internal.cluster_queries WHERE user_name='argroup'`)
await run('txns', `SELECT id::text, start, status, left(COALESCE(priority::text,''),20) FROM crdb_internal.cluster_transactions LIMIT 20`)
await run('locks', `SELECT * FROM crdb_internal.cluster_locks WHERE table_name = 'posts' LIMIT 20`)
await run('sessions', `SELECT session_id::text, active_queries, status FROM [SHOW SESSIONS] WHERE user_name='argroup' LIMIT 20`)

// Try bypassing locks with historical read
await run('posts_asof', `SELECT count(*)::int AS n FROM cms.posts AS OF SYSTEM TIME '-5s'`)
await run('posts_limit', `SELECT id FROM cms.posts AS OF SYSTEM TIME '-5s' LIMIT 3`)
await run('pages_ok', `SELECT count(*)::int AS n FROM cms.pages`)
await run('users_ok', `SELECT count(*)::int AS n FROM cms.users`)

await c.end()
