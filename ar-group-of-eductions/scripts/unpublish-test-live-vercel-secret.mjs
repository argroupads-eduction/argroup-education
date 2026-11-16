import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const cmsRoot = path.join(dir, '..')
const monorepo = path.join(cmsRoot, '..')
const pulled = path.join(cmsRoot, '.env.vercel.pull.tmp')
const slug = 'suvbudfbvuhuysdbfuyefuyef'

function vercel(args, cwd) {
  const cmd = process.platform === 'win32' ? 'vercel.cmd' : 'vercel'
  return execFileSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function parseEnv(file) {
  const map = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i < 0) continue
    let v = line.slice(i + 1)
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    map[line.slice(0, i)] = v
  }
  return map
}

// Pull CMS production env
try {
  if (fs.existsSync(pulled)) fs.unlinkSync(pulled)
  vercel(['env', 'pull', pulled, '--environment', 'production', '--yes'], cmsRoot)
} catch (e) {
  // try monorepo root link
  try {
    vercel(['env', 'pull', pulled, '--environment', 'production', '--yes'], monorepo)
  } catch (e2) {
    console.error('pull_failed')
    process.exit(1)
  }
}

const env = parseEnv(pulled)
fs.unlinkSync(pulled)

const secrets = [env.REVALIDATE_SECRET, env.PAYLOAD_SYNC_SECRET].filter(Boolean)
console.log(
  'pulled_secrets',
  secrets.map((s) => `len=${s.length}`).join(', '),
  'BACKEND=',
  env.BACKEND_API_URL || '(none)',
)

const body = JSON.stringify({
  type: 'post',
  slug,
  title: slug,
  content: '',
  published: false,
  pullFromCms: false,
})

let ok = false
for (const secret of [...new Set(secrets)]) {
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
  console.log('live', res.status, text.slice(0, 220))
  if (res.ok) {
    ok = true
    break
  }
}

// Also unpublish via CMS Payload if possible - find post by slug on cockroach using CMS DATABASE_URL
const dbUrl = env.DATABASE_URL
if (dbUrl) {
  const pg = await import('pg')
  const c = new pg.default.Client({
    connectionString: dbUrl.replace(/[?&]sslmode=[^&]*/gi, ''),
    ssl: { rejectUnauthorized: false },
    statement_timeout: 20_000,
  })
  await c.connect()
  await c.query("SET statement_timeout = '15s'")
  const found = await c.query(
    `SELECT id, slug, _status FROM cms.posts WHERE slug = $1 OR title ILIKE $1`,
    [slug],
  )
  console.log('cms_posts', found.rows)
  if (found.rows[0]) {
    await c.query(`UPDATE cms.posts SET _status = 'draft', updated_at = now() WHERE id = $1`, [
      found.rows[0].id,
    ])
    console.log('cms_drafted', found.rows[0].id)
  }
  const del = await c.query(`DELETE FROM public."BlogPost" WHERE slug = $1 RETURNING id`, [slug])
  console.log('blogpost_deleted', del.rowCount)
  await c.end()
}

process.exit(ok ? 0 : 2)
