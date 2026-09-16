/**
 * Vercel install hook (CMS project).
 * Some deployments may still reference `scripts/vercel-install.mjs`.
 * Keep this script local to the Payload app so install never fails.
 */
import { execSync } from 'node:child_process'

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', env: process.env })
}

try {
  run('npm ci')
} catch {
  run('npm install')
}

