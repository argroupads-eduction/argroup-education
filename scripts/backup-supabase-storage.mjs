/**
 * OPTIONAL — only if media lived in Supabase Storage buckets.
 * This project uses Vercel Blob (+ relative /api/media URLs), so this script is
 * a ready template, not required for the current production media layout.
 *
 * Usage (PowerShell):
 *   $env:SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="..."   # never commit
 *   node scripts/backup-supabase-storage.mjs
 *
 * Downloads every object from every bucket into ./backups/supabase_storage_backup/
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outRoot = path.join(root, 'backups', 'supabase_storage_backup')

const base = process.env.SUPABASE_URL?.trim().replace(/\/$/, '')
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!base || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (not printed).')
  process.exit(1)
}

async function api(pathname) {
  const res = await fetch(`${base}/storage/v1${pathname}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
    },
  })
  if (!res.ok) {
    throw new Error(`Storage API ${res.status} ${pathname}`)
  }
  return res
}

async function listBuckets() {
  const res = await api('/bucket')
  return res.json()
}

async function listAll(bucket, prefix = '') {
  const out = []
  let offset = 0
  const limit = 100
  for (;;) {
    const res = await fetch(`${base}/storage/v1/object/list/${encodeURIComponent(bucket)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefix, limit, offset }),
    })
    if (!res.ok) throw new Error(`list failed ${res.status}`)
    const batch = await res.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    for (const item of batch) {
      const name = item.name
      if (!name) continue
      const full = prefix ? `${prefix}${name}` : name
      // folders often have id null / metadata null
      if (item.id == null && !item.metadata) {
        out.push(...(await listAll(bucket, `${full}/`)))
      } else {
        out.push(full)
      }
    }
    if (batch.length < limit) break
    offset += limit
  }
  return out
}

async function download(bucket, objectPath) {
  const res = await api(`/object/${encodeURIComponent(bucket)}/${objectPath.split('/').map(encodeURIComponent).join('/')}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const dest = path.join(outRoot, bucket, objectPath)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, buf)
  return buf.length
}

async function main() {
  fs.mkdirSync(outRoot, { recursive: true })
  const buckets = await listBuckets()
  let files = 0
  let bytes = 0
  for (const b of buckets) {
    const name = b.name || b.id
    if (!name) continue
    console.log(`Bucket: ${name}`)
    const objects = await listAll(name)
    console.log(`  objects=${objects.length}`)
    for (const obj of objects) {
      const n = await download(name, obj)
      files += 1
      bytes += n
    }
  }
  console.log(`Done files=${files} bytes=${bytes} out=${outRoot}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
