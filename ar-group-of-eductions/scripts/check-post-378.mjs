import dotenv from 'dotenv'
import pg from 'pg'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(dir, '..', '.env') })

const url = process.env.DATABASE_URL.trim().replace(/^["']|["']$/g, '')
const c = new pg.Client({
  connectionString: url.replace(/[?&]sslmode=[^&]*/gi, ''),
  ssl: { rejectUnauthorized: true },
})
await c.connect()
const d = await c.query(
  `SELECT column_default FROM information_schema.columns WHERE table_schema='cms' AND table_name='_posts_v' AND column_name='id'`,
)
console.log('posts_v_default', d.rows[0])
const v = await c.query(
  `SELECT id, latest, autosave, version__status, updated_at FROM cms._posts_v WHERE parent_id=378 ORDER BY id DESC LIMIT 8`,
)
console.log('versions_378', v.rows)
const p = await c.query(`SELECT id, _status, updated_at FROM cms.posts WHERE id=378`)
console.log('post_378', p.rows[0])
await c.end()
