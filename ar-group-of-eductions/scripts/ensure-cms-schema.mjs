/**
 * Create Payload `cms` schema on Supabase/Neon (separate from Prisma `public` tables).
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env'), override: true })

const connectionString = process.env.DATABASE_URL?.trim()
if (!connectionString) {
  console.log('[ensure-cms-schema] DATABASE_URL not set — skip')
  process.exit(0)
}

const isSupabase = connectionString.includes('supabase.com')
const pgUrl = isSupabase
  ? connectionString.replace(/([?&])sslmode=[^&]*/gi, '$1').replace(/[?&]$/, '').replace(/\?&/, '?')
  : connectionString

const client = new pg.Client(
  isSupabase
    ? { connectionString: pgUrl, ssl: { rejectUnauthorized: false } }
    : { connectionString: pgUrl },
)

try {
  await client.connect()
  await client.query('CREATE SCHEMA IF NOT EXISTS cms')
  console.log('[ensure-cms-schema] cms schema ready')
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error('[ensure-cms-schema] Failed:', message)
  process.exit(1)
} finally {
  await client.end().catch(() => {})
}
