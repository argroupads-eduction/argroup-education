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

/** Cloud Postgres URL for Payload (Supabase, Neon, or CockroachDB). */
export function resolveDatabaseUrl(): string {
  return resolveDatabasePoolConfig().connectionString
}

function isCockroachConnectionString(raw: string): boolean {
  return (
    /cockroachlabs\.cloud/i.test(raw) ||
    /cockroachdb\.cloud/i.test(raw) ||
    /[:@][^/?]+:26257(?:\/|\?|$)/i.test(raw)
  )
}

/** pg pool config — Supabase on Windows needs explicit ssl (not sslmode in URL). */
export function resolveDatabasePoolConfig(): {
  connectionString: string
  ssl?: { rejectUnauthorized: boolean }
  max?: number
  connectionTimeoutMillis?: number
  idleTimeoutMillis?: number
  allowExitOnIdle?: boolean
} {
  loadDatabaseEnv()

  let raw = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, '')
  if (!raw) {
    throw new Error(
      'DATABASE_URL is missing. Copy ar-group-of-eductions/.env.example to .env and set your Postgres URL (Supabase, Neon, or CockroachDB).',
    )
  }

  if (raw.includes('127.0.0.1') || raw.includes('localhost') || raw.includes('192.168.')) {
    throw new Error(
      'DATABASE_URL points to a local Postgres host. Use your cloud Postgres URL in ar-group-of-eductions/.env',
    )
  }

  const isSupabase = raw.includes('supabase.com')
  const isCockroach = isCockroachConnectionString(raw)
  const isVercel = process.env.VERCEL === '1'

  // Prefer Neon pooler for stable connections from dev machines.
  if (raw.includes('.neon.tech') && !raw.includes('-pooler.')) {
    raw = raw.replace(/(@ep-[^.]+\.)(c-\d+\.)/, '$1pooler.$2')
  }

  if (raw.includes('.neon.tech') && raw.includes('-pooler.') && !/[?&]pgbouncer=true/i.test(raw)) {
    raw += raw.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true'
  }

  if (isCockroach) {
    // Vercel serverless: prefer sslmode=require (system CAs). Local: verify-full (Cockroach docs).
    if (isVercel) {
      raw = raw.replace(/([?&])sslmode=[^&]*/gi, '$1sslmode=require')
      if (!/[?&]sslmode=/i.test(raw)) {
        raw += raw.includes('?') ? '&sslmode=require' : '?sslmode=require'
      }
    } else if (!/[?&]sslmode=/i.test(raw)) {
      raw += raw.includes('?') ? '&sslmode=verify-full' : '?sslmode=verify-full'
    }
  } else if (isSupabase) {
    // sslmode in the URL forces strict verify-full on Node pg → SELF_SIGNED_CERT_IN_CHAIN on Windows.
    raw = raw.replace(/([?&])sslmode=[^&]*/gi, '$1').replace(/[?&]$/, '').replace(/\?&/, '?')
    // Transaction pooler (6543) needs pgbouncer flag so node-pg/drizzle avoid broken prepared stmts.
    if (/pooler\.supabase\.com/i.test(raw) && !/[?&]pgbouncer=true/i.test(raw)) {
      raw += raw.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true'
    }
  } else if (!/[?&]sslmode=/i.test(raw)) {
    raw += raw.includes('?') ? '&sslmode=require' : '?sslmode=require'
  }

  if (!/[?&]connect_timeout=/i.test(raw)) {
    raw += raw.includes('?') ? '&connect_timeout=10' : '?connect_timeout=10'
  }

  // Vercel serverless: Payload's postgres adapter checks out 1 client for reconnect
  // monitoring and never releases it — max:1 starves all queries (~8s timeout → 500/504).
  // Keep pool tiny (Hobby / Supabase) but leave headroom for real queries.
  const serverlessPool = isVercel
    ? {
        max: 3,
        connectionTimeoutMillis: 10_000,
        idleTimeoutMillis: 5_000,
        allowExitOnIdle: true,
      }
    : {}

  if (isCockroach) {
    return {
      connectionString: raw,
      // Vercel: require TLS but avoid verify-full CA path issues in serverless.
      // Local: keep strict verification.
      ssl: { rejectUnauthorized: !isVercel },
      ...serverlessPool,
    }
  }

  return isSupabase
    ? { connectionString: raw, ssl: { rejectUnauthorized: false }, ...serverlessPool }
    : { connectionString: raw, ...serverlessPool }
}
