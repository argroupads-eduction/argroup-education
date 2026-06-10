/**
 * Idempotent Neon schema fixes for Payload CMS runtime (Vercel deploy).
 * Usage: node scripts/sync-cms-runtime-schema.mjs
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env'), override: true })

const connectionString = process.env.DATABASE_URL?.trim()
if (!connectionString) {
  console.log('[sync-cms-runtime-schema] DATABASE_URL not set — skip')
  process.exit(0)
}

const sql = `
ALTER TABLE IF EXISTS pages ADD COLUMN IF NOT EXISTS seo_keywords text;
ALTER TABLE IF EXISTS _pages_v ADD COLUMN IF NOT EXISTS version_seo_keywords text;
ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS seo_keywords text;
ALTER TABLE IF EXISTS _posts_v ADD COLUMN IF NOT EXISTS version_seo_keywords text;
ALTER TABLE IF EXISTS pages ALTER COLUMN html_content TYPE text;
ALTER TABLE IF EXISTS _pages_v ALTER COLUMN version_html_content TYPE text;
ALTER TABLE IF EXISTS posts ALTER COLUMN html_content TYPE text;
ALTER TABLE IF EXISTS _posts_v ALTER COLUMN version_html_content TYPE text;
`

const client = new pg.Client({ connectionString })
await client.connect()
await client.query(sql)
await client.end()
console.log('[sync-cms-runtime-schema] Done')
