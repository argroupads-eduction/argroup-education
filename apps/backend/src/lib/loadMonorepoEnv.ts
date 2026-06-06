import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

let loaded = false;

/** Load .env from monorepo root, apps/backend, and apps/frontend (Next.js API routes). */
export function loadMonorepoEnv(): void {
  if (loaded) return;
  loaded = true;

  const tried = new Set<string>();
  const tryFile = (filePath: string) => {
    const resolved = path.resolve(filePath);
    if (tried.has(resolved) || !fs.existsSync(resolved)) return;
    tried.add(resolved);
    dotenv.config({ path: resolved });
  };

  const cwd = process.cwd();
  const roots = [
    cwd,
    path.join(cwd, '..'),
    path.join(cwd, '../..'),
    path.resolve(__dirname, '../..'),
    path.resolve(__dirname, '../../..'),
  ];

  for (const root of roots) {
    tryFile(path.join(root, '.env'));
    tryFile(path.join(root, '.env.local'));
    tryFile(path.join(root, 'apps/backend/.env'));
    tryFile(path.join(root, 'apps/backend/.env.local'));
    tryFile(path.join(root, 'apps/frontend/.env.local'));
    tryFile(path.join(root, 'apps/frontend/.env'));
  }
}

export function isSmtpConfigured(): boolean {
  loadMonorepoEnv();
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  );
}
