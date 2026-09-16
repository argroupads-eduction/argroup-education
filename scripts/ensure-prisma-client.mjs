#!/usr/bin/env node
/**
 * Run prisma generate only when the query engine is missing.
 * Tolerates OneDrive/Windows EPERM when the client is already usable.
 */
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveRepoRoot } from './resolve-repo-root.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = resolveRepoRoot();

const clientDir = path.join(repoRoot, 'node_modules', '.prisma', 'client');
const enginePath = path.join(clientDir, 'query_engine-windows.dll.node');
const indexPath = path.join(clientDir, 'index.js');

function clientReady() {
  if (!existsSync(enginePath) || !existsSync(indexPath)) return false;
  try {
    return statSync(enginePath).size > 1_000_000;
  } catch {
    return false;
  }
}

if (clientReady()) {
  console.log('[prisma] Client already present — skipping generate.');
  process.exit(0);
}

console.log('[prisma] Generating client…');
const result = spawnSync('npm', ['run', 'db:generate', '--workspace=ar-education-backend'], {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: true,
});

if (result.status === 0) {
  process.exit(0);
}

if (clientReady()) {
  console.warn('[prisma] Generate reported an error but client looks usable (common on OneDrive). Continuing.');
  process.exit(0);
}

process.exit(result.status ?? 1);
