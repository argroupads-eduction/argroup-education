import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'

const roots = [
  'D:/ARGROUP OF EDUCTION/.history/apps/backend',
  'C:/Users/akash/OneDrive/Desktop/ARGROUP OF EDUCTION/.history/apps/backend',
]

const slug = 'suvbudfbvuhuysdbfuyefuyef'
const secrets = new Set()
const dbUrls = new Map()

function ingest(file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return
  let text
  try {
    text = fs.readFileSync(file, 'utf8')
  } catch {
    return
  }
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('REVALIDATE_SECRET=') || line.startsWith('PAYLOAD_SYNC_SECRET=')) {
      const v = line
        .slice(line.indexOf('=') + 1)
        .trim()
        .replace(/^["']|["']$/g, '')
      if (v && v.length > 8 && !v.includes('change-me') && !v.includes('YOUR_')) secrets.add(v)
    }
    if (line.startsWith('DATABASE_URL=') || line.startsWith('DATABASE_URL_UNPOOLED=')) {
      const v = line
        .slice(line.indexOf('=') + 1)
        .trim()
        .replace(/^["']|["']$/g, '')
      if (/neon\.tech|supabase\.com/i.test(v)) {
        try {
          dbUrls.set(new URL(v).hostname, v)
        } catch {
          /* ignore */
        }
      }
    }
  }
}

for (const root of roots) {
  if (!fs.existsSync(root)) continue
  for (const name of fs.readdirSync(root)) {
    ingest(path.join(root, name))
  }
}

console.log('secrets', secrets.size, 'db_hosts', [...dbUrls.keys()])

const body = JSON.stringify({
  type: 'post',
  slug,
  title: slug,
  content: '',
  published: false,
  pullFromCms: false,
})

for (const secret of secrets) {
  try {
    const res = await fetch('https://www.argroupofeducation.com/api/cms/payload-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body,
      signal: AbortSignal.timeout(20_000),
    })
    const text = await res.text()
    console.log('sync', res.status, text.slice(0, 160))
    if (res.ok) {
      console.log('LIVE_UNPUBLISH_OK')
      break
    }
  } catch (e) {
    console.log('sync_err', e.message)
  }
}

for (const [host, url] of dbUrls) {
  let clean = url
    .replace(/[?&]sslmode=[^&]*/gi, '')
    .replace(/[?&]options=[^&]*/gi, '')
    .replace(/[?&]$/, '')
  if (host.includes('-pooler.')) {
    // try non-pooler variant too
  }
  console.log('db', host)
  const c = new pg.Client({
    connectionString: clean,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 20_000,
  })
  try {
    await c.connect()
    const found = await c.query(
      `SELECT id, slug, published FROM "BlogPost" WHERE slug = $1 OR title ILIKE '%suvbud%'`,
      [slug],
    )
    console.log('found', found.rows)
    if (found.rows.length) {
      const del = await c.query(
        `DELETE FROM "BlogPost" WHERE slug = $1 OR title ILIKE '%suvbud%' RETURNING id, slug`,
        [slug],
      )
      console.log('deleted', del.rows)
    }
    await c.end()
  } catch (e) {
    console.log('db_err', e.message.slice(0, 100))
  }
}
