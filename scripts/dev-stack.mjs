#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { resolveRepoRoot } from './resolve-repo-root.mjs';

const repoRoot = resolveRepoRoot();
process.chdir(repoRoot);

console.log(`[dev] Project root: ${repoRoot}`);

const cmd =
  'npx concurrently -k -n backend,frontend -c yellow,cyan "npm run dev -w apps/backend" "npm run dev -w apps/frontend"';

const child = spawn(cmd, {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
