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
const a = await c.query("SELECT id, _status FROM cms.posts ORDER BY id DESC LIMIT 3")
console.log("sample_posts", a.rows)
const b = await c.query("SELECT id, slug, published FROM public.\"BlogPost\" ORDER BY id DESC LIMIT 3")
console.log("sample_blogs", b.rows)
await c.end()
