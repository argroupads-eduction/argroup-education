/**
 * Set CMS Vercel production env for Cockroach cutover (no secrets printed).
 * Usage: node scripts/prepare-vercel-cms-prod-env.mjs
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(dir, '..')
const vercelCmd = process.platform === 'win32' ? 'vercel.cmd' : 'vercel'

function readEnvFile(filePath) {
  const out = {}
  if (!fs.existsSync(filePath)) return out
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i < 0) continue
    const k = line.slice(0, i).trim()
    let v = line.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (valStarts(v))) {
      v = v.slice(1, -1)
    }
    out[k] = v
  }
  return out
}

function valStarts(v) {
  return (v.startsWith("'") && v.endsWith("'"))
}

function hostOf(url) {
  try {
    return new URL(url).hostname
  } catch {
    return '(invalid)'
  }
}

function vercel(args, input) {
  return execFileSync(vercelCmd, args, {
    cwd: root,
    input: input != null ? String(input) : undefined,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })
}

function upsertEnv(name, value, environments) {
  for (const env of environments) {
    try {
      vercel(['env', 'rm', name, env, '--yes'])
      console.log(`removed ${name} (${env})`)
    } catch {
      // missing is fine
    }
    try {
      vercel(['env', 'add', name, env, '--sensitive'], `${value}\n`)
      console.log(`added ${name} (${env})`)
    } catch (e) {
      console.error(`FAILED ${name} (${env})`, e.stderr || e.message)
      throw e
    }
  }
}

const local = {
  ...readEnvFile(path.join(root, '.env.cockroachdb')),
  ...readEnvFile(path.join(root, '.env')),
}

const databaseUrl = (local.DATABASE_URL || '').trim()
if (!databaseUrl || !/cockroachlabs\.cloud/i.test(databaseUrl)) {
  console.error('Cockroach DATABASE_URL missing in .env / .env.cockroachdb')
  process.exit(1)
}

// Serverless-friendly TLS mode
let prodDbUrl = databaseUrl.replace(/sslmode=verify-full/gi, 'sslmode=require')
if (!/[?&]sslmode=/i.test(prodDbUrl)) {
  prodDbUrl += prodDbUrl.includes('?') ? '&sslmode=require' : '?sslmode=require'
}

const cmsPublicUrl =
  process.env.CMS_PUBLIC_URL?.trim() ||
  'https://argroup-education-cms-livid.vercel.app'

const cronSecret =
  local.CRON_SECRET?.trim() || crypto.randomBytes(24).toString('hex')

console.log('DATABASE_URL host=', hostOf(prodDbUrl))
console.log('NEXT_PUBLIC_SERVER_URL=', cmsPublicUrl)
console.log('BACKEND_API_URL=https://www.argroupofeducation.com')
console.log('CRON_SECRET len=', cronSecret.length)

upsertEnv('DATABASE_URL', prodDbUrl, ['production', 'preview'])
upsertEnv('NEXT_PUBLIC_SERVER_URL', cmsPublicUrl, ['production', 'preview'])
upsertEnv('BACKEND_API_URL', 'https://www.argroupofeducation.com', ['production'])
upsertEnv('FRONTEND_APP_URL', 'https://www.argroupofeducation.com', ['production'])
upsertEnv('PAYLOAD_DATABASE_PUSH', 'false', ['production', 'preview'])
upsertEnv('CRON_SECRET', cronSecret, ['production', 'preview'])

// Keep local .env CRON_SECRET in sync if we generated one
if (!local.CRON_SECRET) {
  fs.appendFileSync(path.join(root, '.env'), `\nCRON_SECRET=${cronSecret}\n`)
  console.log('wrote CRON_SECRET to local .env')
}

console.log('DONE — next: vercel --prod')
