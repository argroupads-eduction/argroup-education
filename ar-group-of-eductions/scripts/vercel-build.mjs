/**
 * Vercel build hook (CMS project).
 * Runs Next.js directly so parent-repo Turborepo does not skip this package
 * (ar-group-of-eductions is not in npm workspaces / turbo pipeline).
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = path.join(root, '.next', 'routes-manifest.json')

function run(cmd) {
  execSync(cmd, {
    stdio: 'inherit',
    env: process.env,
    cwd: root,
  })
}

const skipSchemaSync =
  process.env.SKIP_CMS_SCHEMA_SYNC === '1' || process.env.SKIP_CMS_SCHEMA_SYNC === 'true'

if (process.env.DATABASE_URL && !skipSchemaSync) {
  console.log('[vercel-build] Syncing CMS database schema...')
  try {
    run('node scripts/sync-cms-runtime-schema.mjs')
  } catch (error) {
    // Idempotent DDL — safe to skip when Neon is unreachable or over quota; CMS still builds.
    console.warn(
      '[vercel-build] Schema sync failed — continuing build:',
      error?.message ?? error,
    )
    console.warn(
      '[vercel-build] Re-run `node scripts/sync-cms-runtime-schema.mjs` when the database is available.',
    )
  }
} else if (!process.env.DATABASE_URL) {
  console.warn('[vercel-build] DATABASE_URL not set — skipping schema sync')
} else {
  console.warn('[vercel-build] SKIP_CMS_SCHEMA_SYNC set — skipping schema sync')
}

if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
  console.log('[vercel-build] Regenerating Payload import map (Vercel Blob client uploads)...')
  try {
    run('npm run generate:importmap')
  } catch (error) {
    console.warn(
      '[vercel-build] import map generation failed — continuing build:',
      error?.message ?? error,
    )
  }
} else {
  console.warn(
    '[vercel-build] BLOB_READ_WRITE_TOKEN not set — skipping import map regen (media uploads use local staticDir in dev only)',
  )
}

console.log('[vercel-build] Building Payload CMS (webpack, no turbo orchestration)...')

run('npx cross-env NODE_OPTIONS=--no-deprecation next build --webpack')

if (!fs.existsSync(manifestPath)) {
  console.error('[vercel-build] Missing .next/routes-manifest.json — build output not found.')
  process.exit(1)
}

console.log('[vercel-build] Build OK:', manifestPath)

try {
  run('npx next-sitemap --config next-sitemap.config.cjs')
} catch (error) {
  console.warn('[vercel-build] next-sitemap skipped:', error?.message ?? error)
}
