/**
 * Add htmlContent / featuredImageUrl columns to Neon (when Drizzle push did not run).
 * Usage: node scripts/sync-html-columns.mjs
 */
import 'dotenv/config';
import pg from 'pg';

const sql = `
ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS html_content text;
ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS featured_image_url varchar;
ALTER TABLE IF EXISTS _posts_v ADD COLUMN IF NOT EXISTS version_html_content text;
ALTER TABLE IF EXISTS _posts_v ADD COLUMN IF NOT EXISTS version_featured_image_url varchar;
ALTER TABLE IF EXISTS pages ADD COLUMN IF NOT EXISTS html_content text;
ALTER TABLE IF EXISTS pages ADD COLUMN IF NOT EXISTS featured_image_url varchar;
ALTER TABLE IF EXISTS _pages_v ADD COLUMN IF NOT EXISTS version_html_content text;
ALTER TABLE IF EXISTS _pages_v ADD COLUMN IF NOT EXISTS version_featured_image_url varchar;
`;

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(sql);
await client.end();
console.log('[sync-html-columns] Done — posts/pages html_content columns ready.');
