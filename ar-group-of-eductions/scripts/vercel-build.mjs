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

if (process.env.DATABASE_URL) {
  console.log('[vercel-build] Syncing CMS database schema...')
  try {
    run('node scripts/sync-cms-runtime-schema.mjs')
  } catch (error) {
    console.error('[vercel-build] Schema sync failed:', error?.message ?? error)
    process.exit(1)
  }
} else {
  console.warn('[vercel-build] DATABASE_URL not set — skipping schema sync')
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
