import dotenv from "dotenv"
import pg from "pg"
import path from "node:path"
import { fileURLToPath } from "node:url"
const dir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(dir, "..", ".env") })
const raw = process.env.DATABASE_URL.trim().replace(/^[\"']|[\"']$/g, "")
const c = new pg.Client({ connectionString: raw.replace(/[?&]sslmode=[^&]*/gi, ""), ssl: { rejectUnauthorized: true }, statement_timeout: 20000 })
await c.connect()
await c.query("SET statement_timeout = '15s'")
const tables = await c.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='cms' AND table_name ILIKE '%lock%' ORDER BY 1`)
console.log("lock_tables", tables.rows)
for (const t of tables.rows) {
  const name = t.table_name
  const cols = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='cms' AND table_name=$1 ORDER BY ordinal_position`, [name])
  console.log(name, "cols", cols.rows.map(r => r.column_name))
  const sample = await c.query(`SELECT * FROM cms."${name}" LIMIT 20`)
  console.log(name, "rows", sample.rows)
}
await c.end()
