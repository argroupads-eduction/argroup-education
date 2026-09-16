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
const t0 = Date.now()
const r = await c.query('SELECT count(*)::int AS n FROM cms.posts')
console.log('live_posts', r.rows[0], Date.now()-t0+'ms')
await c.end()
