/**
 * Re-attach nextval() defaults on cms.* id columns after Cockroach PK migration.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'

const dir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(dir, '..', '.env.cockroachdb') })
dotenv.config({ path: path.join(dir, '..', '.env') })

const url = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, '')
if (!url || !/cockroachlabs\.cloud|:26257/i.test(url)) {
  console.error('Need Cockroach DATABASE_URL')
  process.exit(1)
}

const client = new pg.Client({
  connectionString: url.replace(/[?&]sslmode=[^&]*/gi, ''),
  ssl: { rejectUnauthorized: true },
})
await client.connect()

const { rows: seqs } = await client.query(`
  SELECT sequence_name
  FROM information_schema.sequences
  WHERE sequence_schema = 'cms' AND sequence_name LIKE '%\\_id_seq' ESCAPE '\\'
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
  if (!exists.rowCount) {
    console.log('SKIP', sequence_name)
    continue
  }
  try {
    const seqFq = `cms.${sequence_name}`
    await client.query(
      `ALTER TABLE cms.${quote(table)} ALTER COLUMN id SET DEFAULT nextval('${seqFq.replace(/'/g, "''")}')`,
    )
    const { rows } = await client.query(`SELECT COALESCE(max(id), 0)::bigint AS m FROM cms.${quote(table)}`)
    const max = Number(rows[0].m) || 0
    // setval(seq, max, true) => next nextval is max+1
    await client.query(`SELECT setval($1, $2, true)`, [`cms.${sequence_name}`, Math.max(max, 1)])
    console.log('OK', table, 'max=', max)
  } catch (err) {
    console.log('FAIL', table, String(err.message).slice(0, 160))
  }
}

const check = await client.query(`
  SELECT table_name, column_default
  FROM information_schema.columns
  WHERE table_schema='cms' AND column_name='id'
    AND table_name IN ('_posts_v','posts','payload_locked_documents','payload_preferences','search','media')
  ORDER BY 1
`)
console.log('defaults', check.rows)

await client.end()

function quote(ident) {
  return `"${String(ident).replace(/"/g, '""')}"`
}
