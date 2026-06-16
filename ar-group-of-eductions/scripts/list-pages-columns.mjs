import dotenv from 'dotenv'
import pg from 'pg'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })
const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()
const r = await client.query(`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'pages' ORDER BY ordinal_position
`)
console.log(r.rows.map((x) => x.column_name).join('\n'))
await client.end()
