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

const db = await c.query('SELECT current_database() AS db')
console.log('db', db.rows[0])

// Show long-running queries
try {
  const q = await c.query(`
    SELECT session_id::text, start, status, application_name,
           left(query, 120) AS q
    FROM [SHOW CLUSTER STATEMENTS]
    WHERE status = 'Running'
    ORDER BY start
    LIMIT 20
  `)
  console.log('running_statements', q.rows)
} catch (e) {
  console.log('SHOW CLUSTER STATEMENTS failed', e.message)
  try {
    const q2 = await c.query(`
      SELECT query_id::text, start, application_name, left(query, 120) AS q
      FROM crdb_internal.cluster_queries
      WHERE active = true
      ORDER BY start
      LIMIT 20
    `)
    console.log('cluster_queries', q2.rows)
  } catch (e2) {
    console.log('cluster_queries failed', e2.message)
  }
}

try {
  const u = await c.query('SELECT id, email FROM cms.users LIMIT 3')
  console.log('users_ok', u.rows)
} catch (e) {
  console.log('users_ERROR', e.message)
}

try {
  const p = await c.query('SELECT count(*)::int AS n FROM cms.posts')
  console.log('posts_count', p.rows[0])
} catch (e) {
  console.log('posts_ERROR', e.message)
}

await c.end()
