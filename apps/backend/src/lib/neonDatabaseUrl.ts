/**
 * Neon pooled URLs require `pgbouncer=true` for Prisma (disables prepared statements).
 * @see https://www.prisma.io/docs/guides/database/neon
 */
export function neonDatabaseUrl(raw?: string): string {
  if (!raw?.trim()) {
    throw new Error(
      'DATABASE_URL is missing. Copy apps/backend/.env.example to .env and set Neon credentials.'
    );
  }

  let url = raw.trim().replace(/^["']|["']$/g, '');
  const isPooler = url.includes('-pooler.');

  const ensureParam = (key: string, value: string) => {
    const re = new RegExp(`([?&])${key}=`, 'i');
    if (re.test(url)) return;
    url += url.includes('?') ? '&' : '?';
    url += `${key}=${value}`;
  };

  if (isPooler) {
    ensureParam('pgbouncer', 'true');
  }
  ensureParam('connect_timeout', '15');

  return url;
}

export function isPrismaConnectionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  const msg = String(e.message ?? err);
  return (
    e.code === 'P1001' ||
    e.code === 'P1017' ||
    /connection.*closed/i.test(msg) ||
    /Error in PostgreSQL connection/i.test(msg) ||
    /kind: Closed/i.test(msg)
  );
}
