import dotenv from "dotenv"
import pg from "pg"
import path from "node:path"
import { fileURLToPath } from "node:url"
const dir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(dir, "..", ".env") })
const raw = process.env.DATABASE_URL.trim().replace(/^[\"']|[\"']$/g, "")
const c = new pg.Client({ connectionString: raw.replace(/[?&]sslmode=[^&]*/gi, ""), ssl: { rejectUnauthorized: true }, statement_timeout: 20000 })
await c.connect()
await c.query("SET statement_timeout = '12s'")
const p = await c.query(`SELECT id, title, slug, _status FROM cms.posts AS OF SYSTEM TIME '-2s' WHERE id = 380 OR slug = 'suvbudfbvuhuysdbfuyefuyef'`)
console.log("post", p.rows)
await c.end()
