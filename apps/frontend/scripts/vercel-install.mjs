/**
 * Vercel install: monorepo root when package-lock is present, else app-only npm install.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const monorepoRoot = path.join(appDir, '../..');
const rootLock = path.join(monorepoRoot, 'package-lock.json');

function run(cmd, cwd) {
  execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
}

if (fs.existsSync(rootLock)) {
  run('npm ci', monorepoRoot);
} else {
  run('npm install', appDir);
}
