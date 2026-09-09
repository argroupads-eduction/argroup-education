import dotenv from 'dotenv'
import pg from 'pg'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(dir, '../..')

function loadEnv(file) {
  if (fs.existsSync(file)) dotenv.config({ path: file })
}

dotenv.config({ path: path.join(dir, '../.env') })
loadEnv(path.join(root, 'apps/backend/.env'))
loadEnv(path.join(root, 'apps/backend/.env.supabase.bak'))
loadEnv(path.join(dir, '../.env.supabase.bak'))

const slug = 'suvbudfbvuhuysdbfuyefuyef'

async function wipe(label, url) {
  if (!url) {
    console.log(label, 'skip_no_url')
    return
  }
  let host = '?'
  try {
    host = new URL(url).hostname
  } catch {
    console.log(label, 'bad_url')
    return
  }
  console.log(label, 'host=', host)
  const c = new pg.Client({
    connectionString: url.replace(/[?&]sslmode=[^&]*/gi, ''),
    ssl: { rejectUnauthorized: false },
    statement_timeout: 25_000,
  })
  try {
    await c.connect()
    await c.query("SET statement_timeout = '20s'")
    try {
      const posts = await c.query(
        `SELECT id, slug, _status FROM cms.posts WHERE slug = $1 OR title ILIKE '%suvbud%'`,
        [slug],
      )
      console.log(label, 'cms.posts', posts.rows)
      for (const row of posts.rows) {
        await c.query(`UPDATE cms.posts SET _status = 'draft', updated_at = now() WHERE id = $1`, [
          row.id,
        ])
      }
    } catch (e) {
      console.log(label, 'cms_skip', e.message.slice(0, 80))
    }
    try {
      const del = await c.query(
        `DELETE FROM public."BlogPost" WHERE slug = $1 OR title ILIKE '%suvbud%' RETURNING id, slug, published`,
        [slug],
      )
      console.log(label, 'BlogPost_deleted', del.rows)
    } catch (e) {
      console.log(label, 'BlogPost_err', e.message.slice(0, 80))
    }
    await c.end()
  } catch (e) {
    console.log(label, 'connect_err', e.message.slice(0, 100))
  }
}

const urls = [
  ['cms_env', process.env.DATABASE_URL],
  ['backend_env', process.env.DATABASE_URL],
  ['unpooled', process.env.DATABASE_URL_UNPOOLED],
]

// Unique by host
const seen = new Set()
for (const [label, url] of urls) {
  if (!url) continue
  let host
  try {
    host = new URL(url.trim().replace(/^["']|["']$/g, '')).hostname
  } catch {
    continue
  }
  if (seen.has(host)) continue
  seen.add(host)
  await wipe(label, url.trim().replace(/^["']|["']$/g, ''))
}

// Explicitly try supabase bak file URLs
function urlFromFile(file, key) {
  if (!fs.existsSync(file)) return null
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (line.startsWith(`${key}=`)) {
      return line
        .slice(key.length + 1)
        .trim()
        .replace(/^["']|["']$/g, '')
    }
  }
  return null
}

const bakUrls = [
  [
    'supabase_bak_cms',
    urlFromFile(path.join(dir, '../.env.supabase.bak'), 'DATABASE_URL'),
  ],
  [
    'supabase_bak_be',
    urlFromFile(path.join(root, 'apps/backend/.env.supabase.bak'), 'DATABASE_URL'),
  ],
  [
    'supabase_bak_be_unpooled',
    urlFromFile(path.join(root, 'apps/backend/.env.supabase.bak'), 'DATABASE_URL_UNPOOLED'),
  ],
]

for (const [label, url] of bakUrls) {
  if (!url) continue
  let host
  try {
    host = new URL(url).hostname
  } catch {
    continue
  }
  if (seen.has(host)) continue
  seen.add(host)
  await wipe(label, url)
}

console.log('done_hosts', [...seen])
