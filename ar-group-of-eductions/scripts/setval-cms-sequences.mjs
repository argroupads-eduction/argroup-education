import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'

const dir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(dir, '..', '.env.cockroachdb') })
dotenv.config({ path: path.join(dir, '..', '.env') })

const url = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, '')
const client = new pg.Client({
  connectionString: url.replace(/[?&]sslmode=[^&]*/gi, ''),
  ssl: { rejectUnauthorized: true },
})
await client.connect()

const { rows: seqs } = await client.query(`
  SELECT sequence_name FROM information_schema.sequences
  WHERE sequence_schema='cms' AND sequence_name LIKE '%\\_id_seq' ESCAPE '\\'
  ORDER BY 1
`)

for (const { sequence_name } of seqs) {
  const table = sequence_name.replace(/_id_seq$/, '')
  const exists = await client.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema='cms' AND table_name=$1 AND column_name='id'
       AND data_type IN ('bigint','integer','numeric')`,
    [table],
  )
  if (!exists.rowCount) continue
  const qTable = `"${table.replace(/"/g, '""')}"`
  const { rows } = await client.query(`SELECT COALESCE(max(id), 0)::bigint AS m FROM cms.${qTable}`)
  const max = Number(rows[0].m) || 0
  const v = Math.max(max, 1)
  await client.query(`SELECT setval('cms.${sequence_name}', ${v}, true)`)
  console.log('setval', sequence_name, v)
}

const ins = await client.query(`
  INSERT INTO cms._posts_v (
    parent_id, version_title, version__status, latest, autosave,
    created_at, updated_at, version_updated_at, version_created_at
  ) VALUES (
    378, 'seq-test', 'draft', false, true, now(), now(), now(), now()
  ) RETURNING id
`)
console.log('smoke_insert_id', ins.rows[0].id)
await client.query(`DELETE FROM cms._posts_v WHERE id = $1`, [ins.rows[0].id])
console.log('smoke_ok')
await client.end()
