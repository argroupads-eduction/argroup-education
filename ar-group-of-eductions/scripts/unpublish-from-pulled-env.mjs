import fs from 'node:fs'
import pg from 'pg'

const pulled = '.env.vercel.pull.tmp'
if (!fs.existsSync(pulled)) {
  console.error('missing pulled env file')
  process.exit(1)
}

const env = {}
for (const line of fs.readFileSync(pulled, 'utf8').split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue
  const i = line.indexOf('=')
  if (i < 0) continue
  let v = line.slice(i + 1)
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1)
  }
  env[line.slice(0, i)] = v
}
fs.unlinkSync(pulled)

const slug = 'suvbudfbvuhuysdbfuyefuyef'
const secrets = [env.REVALIDATE_SECRET, env.PAYLOAD_SYNC_SECRET].filter(Boolean)
console.log('secret_count', new Set(secrets).size)

const body = JSON.stringify({
  type: 'post',
  slug,
  title: slug,
  content: '',
  published: false,
  pullFromCms: false,
})

let liveOk = false
for (const secret of new Set(secrets)) {
  const res = await fetch('https://www.argroupofeducation.com/api/cms/payload-sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body,
    signal: AbortSignal.timeout(30_000),
  })
  const text = await res.text()
  console.log('live', res.status, text.slice(0, 240))
  if (res.ok) {
    liveOk = true
    break
  }
}

if (env.DATABASE_URL) {
  const c = new pg.Client({
    connectionString: env.DATABASE_URL.replace(/[?&]sslmode=[^&]*/gi, ''),
    ssl: { rejectUnauthorized: false },
    statement_timeout: 20_000,
  })
  await c.connect()
  await c.query("SET statement_timeout = '15s'")
  const r = await c.query(`SELECT id, slug, _status FROM cms.posts WHERE slug = $1`, [slug])
  console.log('cms', r.rows)
  if (r.rows[0]) {
    await c.query(`UPDATE cms.posts SET _status = 'draft', updated_at = now() WHERE id = $1`, [
      r.rows[0].id,
    ])
    console.log('cms_drafted')
  }
  // also search by title gibberish
  const r2 = await c.query(
    `SELECT id, slug, _status FROM cms.posts WHERE title ILIKE '%suvbud%' OR slug ILIKE '%suvbud%'`,
  )
  console.log('cms_like', r2.rows)
  for (const row of r2.rows) {
    await c.query(`UPDATE cms.posts SET _status = 'draft', updated_at = now() WHERE id = $1`, [row.id])
  }
  const d = await c.query(`DELETE FROM public."BlogPost" WHERE slug = $1 OR title ILIKE $2`, [
    slug,
    '%suvbud%',
  ])
  console.log('blog_deleted', d.rowCount)
  await c.end()
}

process.exit(liveOk ? 0 : 2)
