/**
 * CockroachDB: tables created without Postgres PKs get hidden rowid PK.
 * Payload needs PRIMARY KEY on `id` (and ON CONFLICT (id) to work).
 * Never prints connection strings.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, 'ar-group-of-eductions', '.env.cockroachdb') })

const url = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, '')
if (!url || !/cockroachlabs\.cloud|:26257/i.test(url)) {
  console.error('Expected Cockroach DATABASE_URL in .env.cockroachdb')
  process.exit(1)
}

const client = new pg.Client({
  connectionString: url.replace(/[?&]sslmode=[^&]*/gi, ''),
  ssl: { rejectUnauthorized: true },
})

await client.connect()

const { rows: tables } = await client.query(`
  SELECT t.tablename
  FROM pg_indexes i
  JOIN pg_tables t ON t.tablename = i.tablename AND t.schemaname = i.schemaname
  WHERE i.schemaname = 'cms'
    AND i.indexname LIKE '%_pkey'
    AND i.indexdef LIKE '%rowid%'
  ORDER BY t.tablename
`)

console.log('tables_with_rowid_pk', tables.length)

for (const { tablename } of tables) {
  const cols = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='cms' AND table_name=$1`,
    [tablename],
  )
  const names = new Set(cols.rows.map((r) => r.column_name))
  if (!names.has('id')) {
    console.log('SKIP', tablename, '(no id column)')
    continue
  }

  // Ensure id values unique before PK swap
  const dup = await client.query(
    `SELECT id::text AS id, count(*)::int AS n FROM cms."${tablename.replace(/"/g, '""')}" GROUP BY id HAVING count(*) > 1 LIMIT 5`,
  )
  if (dup.rows.length) {
    console.log('SKIP', tablename, 'duplicate ids', dup.rows)
    continue
  }

  try {
    await client.query(`ALTER TABLE cms."${tablename.replace(/"/g, '""')}" SET (schema_locked = false)`)
    await client.query(
      `ALTER TABLE cms."${tablename.replace(/"/g, '""')}" ALTER PRIMARY KEY USING COLUMNS (id)`,
    )
    console.log('OK', tablename)
  } catch (err) {
    console.log('FAIL', tablename, String(err.message).slice(0, 180))
  }
}

const left = await client.query(`
  SELECT tablename FROM pg_indexes
  WHERE schemaname='cms' AND indexname LIKE '%_pkey' AND indexdef LIKE '%rowid%'
  ORDER BY 1
`)
console.log('remaining_rowid_pks', left.rows.map((r) => r.tablename))

await client.end()
