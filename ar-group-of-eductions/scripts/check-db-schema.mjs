import dotenv from 'dotenv'
import pg from 'pg'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

const tables = await client.query(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name LIKE '%pages%keyword%'
  ORDER BY table_name
`)
console.log('keyword tables:', tables.rows)

const cols = await client.query(`
  SELECT table_name, column_name FROM information_schema.columns
  WHERE table_schema = 'public'
    AND (column_name LIKE '%keyword%' OR column_name LIKE '%html_content%')
  ORDER BY table_name, column_name
`)
console.log('keyword/html cols:', cols.rows)

try {
  await client.query('SELECT id, slug, html_content FROM pages LIMIT 1')
  console.log('pages query OK')
} catch (e) {
  console.error('pages query FAIL:', e.message)
}

await client.end()
