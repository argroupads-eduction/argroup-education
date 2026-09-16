import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const cmsDir = process.cwd()
const pulled = '.env.prod.safe'
try {
  execFileSync('vercel', ['env', 'pull', pulled, '--environment', 'production', '--yes'], {
    cwd: cmsDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
} catch (e) {
  console.error('pull_failed', e.message)
  process.exit(1)
}

const text = fs.readFileSync(pulled, 'utf8')
fs.unlinkSync(pulled)

for (const line of text.split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue
  const i = line.indexOf('=')
  if (i < 0) continue
  const name = line.slice(0, i)
  let val = line.slice(i + 1)
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1)
  }
  if (name === 'DATABASE_URL') {
    try {
      const u = new URL(val)
      console.log(`DATABASE_URL host=${u.hostname} port=${u.port || 'default'} db=${u.pathname}`)
    } catch {
      console.log('DATABASE_URL parse_fail len=' + val.length)
    }
  } else if (/SECRET|TOKEN|PASSWORD|KEY/.test(name)) {
    console.log(`${name}=set_len=${val.length}`)
  } else if (
    [
      'NEXT_PUBLIC_SERVER_URL',
      'BACKEND_API_URL',
      'FRONTEND_APP_URL',
      'PAYLOAD_DATABASE_PUSH',
      'CRON_SECRET',
    ].includes(name)
  ) {
    console.log(`${name}=${val || '(empty)'}`)
  }
}

const hasCron = /^CRON_SECRET=/m.test(text)
console.log('has_CRON_SECRET', hasCron)
