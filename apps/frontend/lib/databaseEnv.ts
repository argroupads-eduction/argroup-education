import { loadMonorepoEnv } from '@backend/lib/loadMonorepoEnv';

/** Local build/CI placeholder — Prisma would hang on 127.0.0.1:5432. */
const PLACEHOLDER_DB_RE = /@127\.0\.0\.1:5432\//i;

/** True when a real Neon/Postgres URL is configured (not dev build placeholder). */
export function hasUsableDatabase(): boolean {
  loadMonorepoEnv();
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return false;
  if (PLACEHOLDER_DB_RE.test(url)) return false;
  return true;
}
