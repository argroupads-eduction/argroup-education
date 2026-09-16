import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, '.env')

function readKey(file, key) {
  const text = fs.readFileSync(file, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith(`${key}=`)) {
      return line
        .slice(key.length + 1)
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\r$/, '')
    }
  }
  return ''
}

const secret = readKey(envPath, 'REVALIDATE_SECRET') || readKey(envPath, 'PAYLOAD_SYNC_SECRET')
if (!secret || secret === 'change-me-to-a-long-random-string') {
  console.error('local CMS .env still has placeholder/missing secret')
  process.exit(1)
}

const updates = [
  ['REVALIDATE_SECRET', secret],
  ['PAYLOAD_SYNC_SECRET', secret],
  ['BACKEND_API_URL', 'https://www.argroupofeducation.com'],
  ['FRONTEND_APP_URL', 'https://www.argroupofeducation.com'],
]

function run(cmd, args, input) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    input,
    encoding: 'utf8',
    shell: true,
  })
  if (r.stdout?.trim()) console.log(r.stdout.trim())
  if (r.stderr?.trim()) console.log(r.stderr.trim())
  return r.status ?? 1
}

for (const [key, value] of updates) {
  console.log('---', key)
  // Remove existing production value (ignore failure if missing)
  run('npx', ['vercel', 'env', 'rm', key, 'production', '-y'])
  const status = run('npx', ['vercel', 'env', 'add', key, 'production'], `${value}\n`)
  if (status !== 0) {
    console.error('failed_add', key, status)
    process.exit(1)
  }
}

console.log('cms_vercel_env_updated')
