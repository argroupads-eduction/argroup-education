import fs from 'node:fs'
import pg from 'pg'

const file = 'D:/ARGROUP OF EDUCTION/.history/apps/backend/.env_20260606132959'
const env = {}
for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue
  const i = line.indexOf('=')
  if (i < 0) continue
  env[line.slice(0, i)] = line
    .slice(i + 1)
    .trim()
    .replace(/^["']|["']$/g, '')
}

let url = env.DATABASE_URL_UNPOOLED || env.DATABASE_URL
if (!env.DATABASE_URL_UNPOOLED && url.includes('-pooler.')) {
  url = url.replace('-pooler.', '.')
}
url = url
  .replace(/[?&]sslmode=[^&]*/gi, '')
  .replace(/[?&]options=[^&]*/gi, '')
  .replace(/[?&]$/, '')

console.log('host', new URL(url.includes('?') ? url : url + '?sslmode=require').hostname)

const c = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
  statement_timeout: 25_000,
})
await c.connect()
const slug = 'suvbudfbvuhuysdbfuyefuyef'
const found = await c.query(
  `SELECT id, slug, published FROM "BlogPost" WHERE slug = $1 OR title ILIKE '%suvbud%'`,
  [slug],
)
console.log('found', found.rows)
const del = await c.query(
  `DELETE FROM "BlogPost" WHERE slug = $1 OR title ILIKE '%suvbud%' RETURNING id, slug`,
  [slug],
)
console.log('deleted', del.rows)
await c.end()
