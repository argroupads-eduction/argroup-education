import dotenv from "dotenv"
import pg from "pg"
import path from "node:path"
import { fileURLToPath } from "node:url"
const dir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(dir, "..", ".env") })
const raw = process.env.DATABASE_URL.trim().replace(/^[\"']|[\"']$/g, "")
const c = new pg.Client({ connectionString: raw.replace(/[?&]sslmode=[^&]*/gi, ""), ssl: { rejectUnauthorized: true }, statement_timeout: 15000 })
await c.connect()
await c.query("SET statement_timeout = '12s'")
const p = await c.query(`SELECT id, title, slug, _status, updated_at FROM cms.posts WHERE id IN (378,379,380) OR updated_at > now() - interval '2 hours' ORDER BY updated_at DESC LIMIT 8`)
console.log("recent_posts", p.rows)
await c.end()
