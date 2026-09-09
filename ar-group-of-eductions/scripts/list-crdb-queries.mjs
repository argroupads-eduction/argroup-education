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

const cols = await c.query(`
  SELECT column_name FROM information_schema.columns
  WHERE table_schema='crdb_internal' AND table_name='cluster_queries'
  ORDER BY ordinal_position
`)
console.log('cols', cols.rows.map((r) => r.column_name))

const q = await c.query(`SELECT * FROM crdb_internal.cluster_queries LIMIT 30`)
for (const row of q.rows) {
  console.log(JSON.stringify(row))
}

await c.end()
