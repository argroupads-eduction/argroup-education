import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env'), override: true })

const connectionString = process.env.DATABASE_URL?.trim()
const isSupabase = connectionString.includes('supabase.com')
const pgUrl = isSupabase
  ? connectionString.replace(/([?&])sslmode=[^&]*/gi, '$1').replace(/[?&]$/, '').replace(/\?&/, '?')
  : connectionString

const client = new pg.Client(
  isSupabase
    ? { connectionString: pgUrl, ssl: { rejectUnauthorized: false } }
    : { connectionString: pgUrl },
)

await client.connect()
const r = await client.query(
  `SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('cms','public') ORDER BY 1, 2`,
)
for (const row of r.rows) console.log(`${row.table_schema}.${row.table_name}`)
await client.end()
