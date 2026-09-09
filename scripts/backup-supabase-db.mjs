/**
 * Silent full Postgres backup for migration.
 * Reads connection from env (never prints URL/password).
 * Prefers SUPABASE_DIRECT_URL → DATABASE_URL_UNPOOLED → DATABASE_URL.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'backups')
const outFile = path.join(outDir, 'supabase_backup.dump')

function loadEnvFiles() {
  const files = [
    path.join(root, 'ar-group-of-eductions', '.env'),
    path.join(root, 'apps', 'backend', '.env'),
    path.join(root, 'apps', 'frontend', '.env.local'),
    path.join(root, '.env'),
  ]
  for (const f of files) {
    if (fs.existsSync(f)) dotenv.config({ path: f, override: false })
  }
}

function resolveDumpUrl() {
  const candidates = [
    process.env.SUPABASE_DIRECT_URL,
    process.env.DATABASE_URL_UNPOOLED,
    process.env.DATABASE_URL,
  ]
  for (const raw of candidates) {
    const v = raw?.trim().replace(/^["']|["']$/g, '')
    if (v) return { url: v, source: null }
  }
  return null
}

function findPgDump() {
  const fromEnv = process.env.PG_DUMP_PATH?.trim()
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv
  const candidates = [
    'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe',
    'pg_dump',
  ]
  for (const c of candidates) {
    if (c === 'pg_dump') {
      const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['pg_dump'], {
        encoding: 'utf8',
      })
      if (which.status === 0 && which.stdout.trim()) return which.stdout.trim().split(/\r?\n/)[0]
      continue
    }
    if (fs.existsSync(c)) return c
  }
  return null
}

function redactError(msg) {
  return String(msg)
    .replace(/postgresql:\/\/[^\s"']+/gi, 'postgresql://***')
    .replace(/postgres:\/\/[^\s"']+/gi, 'postgresql://***')
    .replace(/:[^:@/]+@/g, ':***@')
}

loadEnvFiles()

const resolved = resolveDumpUrl()
if (!resolved) {
  console.error(
    'No connection URL found. Expected one of: SUPABASE_DIRECT_URL, DATABASE_URL_UNPOOLED, DATABASE_URL',
  )
  process.exit(1)
}

// Report which env KEY was used (not the value)
const usedKey = process.env.SUPABASE_DIRECT_URL?.trim()
  ? 'SUPABASE_DIRECT_URL'
  : process.env.DATABASE_URL_UNPOOLED?.trim()
    ? 'DATABASE_URL_UNPOOLED'
    : 'DATABASE_URL'

const pgDump = findPgDump()
if (!pgDump) {
  console.error('pg_dump not found. Install PostgreSQL client tools, then re-run.')
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

// Prefer session/direct hosts for dump. If URL is Supabase transaction pooler (:6543),
// rewrite to db.<ref>.supabase.co:5432 without logging the URL.
let dumpUrl = resolved.url
try {
  const u = new URL(dumpUrl)
  if (/pooler\.supabase\.com$/i.test(u.hostname) && (u.port === '6543' || !u.port)) {
    // user often looks like postgres.PROJECTREF — extract ref
    const user = decodeURIComponent(u.username || '')
    const refMatch = user.match(/^postgres\.([a-z0-9]+)$/i)
    if (refMatch) {
      u.hostname = `db.${refMatch[1]}.supabase.co`
      u.port = '5432'
      // direct connections use role `postgres` not postgres.ref
      u.username = 'postgres'
      dumpUrl = u.toString()
      console.log('Note: pooler URL detected — using direct db host:5432 for pg_dump (URL not shown).')
    }
  }
} catch {
  // keep original
}

console.log(`Using env key: ${usedKey}`)
console.log(`pg_dump: ${pgDump}`)
console.log(`Output: ${outFile}`)

const args = ['--no-owner', '--no-acl', '--format=custom', '-f', outFile, '--dbname', dumpUrl]
const result = spawnSync(pgDump, args, {
  encoding: 'utf8',
  env: { ...process.env, PGSSLMODE: process.env.PGSSLMODE || 'require' },
  windowsHide: true,
})

if (result.status !== 0) {
  console.error('pg_dump failed:')
  if (result.stderr) console.error(redactError(result.stderr).slice(0, 2000))
  if (result.stdout) console.error(redactError(result.stdout).slice(0, 500))
  process.exit(result.status || 1)
}

const st = fs.statSync(outFile)
console.log(`OK dump bytes=${st.size} path=${outFile}`)
