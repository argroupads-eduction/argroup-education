import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function hasRepoPackage(dir) {
  return fs.existsSync(path.join(dir, 'package.json'));
}

/** Prefer PROJECT_ROOT env, otherwise the folder that contains this scripts/ directory. */
export function resolveRepoRoot() {
  const fromEnv = process.env.PROJECT_ROOT?.trim();
  if (fromEnv && hasRepoPackage(fromEnv)) {
    return path.resolve(fromEnv);
  }

  return path.resolve(__dirname, '..');
}
