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
const before = await c.query(`
  SELECT l.id, r.posts_id, r.pages_id, r.users_id, r.path, l.updated_at
  FROM cms.payload_locked_documents l
  LEFT JOIN cms.payload_locked_documents_rels r ON r.parent_id = l.id
  ORDER BY l.id, r.path
`)
console.log("before", before.rows)
await c.query(`DELETE FROM cms.payload_locked_documents_rels`)
await c.query(`DELETE FROM cms.payload_locked_documents`)
const after = await c.query(`SELECT count(*)::int AS locks FROM cms.payload_locked_documents`)
const afterRels = await c.query(`SELECT count(*)::int AS rels FROM cms.payload_locked_documents_rels`)
console.log("cleared", after.rows[0], afterRels.rows[0])
await c.end()
