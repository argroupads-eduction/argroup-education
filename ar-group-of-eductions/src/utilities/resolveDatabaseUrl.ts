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

/** Neon pooled URL for Payload (avoids local 127.0.0.1 / Hyper-V fallback on Windows). */
export function resolveDatabaseUrl(): string {
  loadDatabaseEnv()

  let raw = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, '')
  if (!raw) {
    throw new Error(
      'DATABASE_URL is missing. Copy ar-group-of-eductions/.env.example to .env and set your Neon URL (use -pooler host).',
    )
  }

  if (raw.includes('127.0.0.1') || raw.includes('localhost') || raw.includes('192.168.')) {
    throw new Error(
      'DATABASE_URL points to a local Postgres host. Use your Neon pooled URL in ar-group-of-eductions/.env',
    )
  }

  // Prefer Neon pooler for stable connections from dev machines.
  if (raw.includes('.neon.tech') && !raw.includes('-pooler.')) {
    raw = raw.replace(/(@ep-[^.]+\.)(c-\d+\.)/, '$1pooler.$2')
  }

  if (raw.includes('-pooler.') && !/[?&]pgbouncer=true/i.test(raw)) {
    raw += raw.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true'
  }

  if (!/[?&]sslmode=/i.test(raw)) {
    raw += raw.includes('?') ? '&sslmode=require' : '?sslmode=require'
  }

  if (!/[?&]connect_timeout=/i.test(raw)) {
    raw += raw.includes('?') ? '&connect_timeout=15' : '?connect_timeout=15'
  }

  return raw
}
