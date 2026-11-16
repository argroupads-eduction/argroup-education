/**
 * Add htmlContent / featuredImageUrl / content / featuredImage columns to Neon.
 * Usage: node scripts/sync-html-columns.mjs
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

const sql = `
ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS html_content text;
ALTER TABLE IF EXISTS posts ALTER COLUMN html_content TYPE text;
ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS featured_image_url varchar;
ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS content jsonb;
ALTER TABLE IF EXISTS _posts_v ADD COLUMN IF NOT EXISTS version_html_content text;
ALTER TABLE IF EXISTS _posts_v ADD COLUMN IF NOT EXISTS version_featured_image_url varchar;
ALTER TABLE IF EXISTS _posts_v ADD COLUMN IF NOT EXISTS version_content jsonb;
ALTER TABLE IF EXISTS pages ADD COLUMN IF NOT EXISTS html_content text;
ALTER TABLE IF EXISTS pages ALTER COLUMN html_content TYPE text;
ALTER TABLE IF EXISTS pages ADD COLUMN IF NOT EXISTS featured_image_url varchar;
ALTER TABLE IF EXISTS pages ADD COLUMN IF NOT EXISTS content jsonb;
ALTER TABLE IF EXISTS pages ADD COLUMN IF NOT EXISTS featured_image_id integer;
ALTER TABLE IF EXISTS _pages_v ADD COLUMN IF NOT EXISTS version_html_content text;
ALTER TABLE IF EXISTS _pages_v ADD COLUMN IF NOT EXISTS version_featured_image_url varchar;
ALTER TABLE IF EXISTS _pages_v ADD COLUMN IF NOT EXISTS version_content jsonb;
ALTER TABLE IF EXISTS _pages_v ADD COLUMN IF NOT EXISTS version_featured_image_id integer;
DO $$ BEGIN
  ALTER TABLE pages ADD CONSTRAINT pages_featured_image_id_media_id_fk
    FOREIGN KEY (featured_image_id) REFERENCES media(id) ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE _pages_v ADD CONSTRAINT _pages_v_version_featured_image_id_media_id_fk
    FOREIGN KEY (version_featured_image_id) REFERENCES media(id) ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
`;

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString || connectionString.includes('invalid.invalid')) {
  throw new Error(
    'DATABASE_URL missing or invalid. Set Neon URL in ar-group-of-eductions/.env',
  );
}

const client = new pg.Client({ connectionString });
await client.connect();
await client.query(sql);
await client.end();
console.log('[sync-html-columns] Done — pages/posts content + featured_image columns ready.');
