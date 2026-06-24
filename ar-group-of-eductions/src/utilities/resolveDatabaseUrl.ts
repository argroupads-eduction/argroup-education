import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/** Load DATABASE_URL for Payload — Next.js + import scripts + monorepo backend .env. */
export function loadDatabaseEnv(): void {
  const tried = new Set<string>()
  const tryFile = (filePath: string) => {
    const resolved = path.resolve(filePath)
    if (tried.has(resolved) || !fs.existsSync(resolved)) return
    tried.add(resolved)
    dotenv.config({ path: resolved })
  }

  const roots = [
    process.cwd(),
    path.join(process.cwd(), '..'),
    path.join(process.cwd(), '../..'),
    path.resolve(dirname, '../..'),
    path.resolve(dirname, '../../..'),
  ]

  for (const root of roots) {
    tryFile(path.join(root, '.env'))
    tryFile(path.join(root, '.env.local'))
    tryFile(path.join(root, 'ar-group-of-eductions/.env'))
    tryFile(path.join(root, 'apps/backend/.env'))
  }
}

/** Cloud Postgres URL for Payload (Neon or Supabase). */
export function resolveDatabaseUrl(): string {
  return resolveDatabasePoolConfig().connectionString
}

/** pg pool config — Supabase on Windows needs explicit ssl (not sslmode in URL). */
export function resolveDatabasePoolConfig(): {
  connectionString: string
  ssl?: { rejectUnauthorized: boolean }
} {
  loadDatabaseEnv()

  let raw = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, '')
  if (!raw) {
    throw new Error(
      'DATABASE_URL is missing. Copy ar-group-of-eductions/.env.example to .env and set your Postgres URL (Neon pooler or Supabase transaction pooler).',
    )
  }

  if (raw.includes('127.0.0.1') || raw.includes('localhost') || raw.includes('192.168.')) {
    throw new Error(
      'DATABASE_URL points to a local Postgres host. Use your cloud Postgres URL in ar-group-of-eductions/.env',
    )
  }

  const isSupabase = raw.includes('supabase.com')

  // Prefer Neon pooler for stable connections from dev machines.
  if (raw.includes('.neon.tech') && !raw.includes('-pooler.')) {
    raw = raw.replace(/(@ep-[^.]+\.)(c-\d+\.)/, '$1pooler.$2')
  }

  if (raw.includes('.neon.tech') && raw.includes('-pooler.') && !/[?&]pgbouncer=true/i.test(raw)) {
    raw += raw.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true'
  }

  if (isSupabase) {
    // sslmode in the URL forces strict verify-full on Node pg → SELF_SIGNED_CERT_IN_CHAIN on Windows.
    raw = raw.replace(/([?&])sslmode=[^&]*/gi, '$1').replace(/[?&]$/, '').replace(/\?&/, '?')
  } else if (!/[?&]sslmode=/i.test(raw)) {
    raw += raw.includes('?') ? '&sslmode=require' : '?sslmode=require'
  }

  if (!/[?&]connect_timeout=/i.test(raw)) {
    raw += raw.includes('?') ? '&connect_timeout=15' : '?connect_timeout=15'
  }

  return isSupabase
    ? { connectionString: raw, ssl: { rejectUnauthorized: false } }
    : { connectionString: raw }
}
