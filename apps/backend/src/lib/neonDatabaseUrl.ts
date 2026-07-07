/**
 * Neon pooled URLs require `pgbouncer=true` for Prisma (disables prepared statements).
 * @see https://www.prisma.io/docs/guides/database/neon
 */
export function getDatabaseProviderLabel(raw?: string): string {
  const url = raw?.trim() ?? process.env.DATABASE_URL?.trim() ?? '';
  if (url.includes('supabase.com')) return 'Supabase';
  if (url.includes('.neon.tech')) return 'Neon';
  return 'Postgres';
}

export function neonDatabaseUrl(raw?: string): string {
  if (!raw?.trim()) {
    throw new Error(
      'DATABASE_URL is missing. Copy apps/backend/.env.example to .env and set Neon credentials.'
    );
  }

  let url = raw.trim().replace(/^["']|["']$/g, '');
  const isNeonPooler = url.includes('-pooler.');
  const isSupabasePooler = url.includes('supabase.com') && /:6543\b/.test(url);

  const ensureParam = (key: string, value: string) => {
    const re = new RegExp(`([?&])${key}=`, 'i');
    if (re.test(url)) return;
    url += url.includes('?') ? '&' : '?';
    url += `${key}=${value}`;
  };

  ensureParam('sslmode', 'require');
  ensureParam('connect_timeout', '30');
  ensureParam('pool_timeout', '30');

  if (isNeonPooler || isSupabasePooler) {
    ensureParam('pgbouncer', 'true');
    // Limit connections per Node process (backend + frontend each get their own pool).
    ensureParam('connection_limit', process.env.PRISMA_CONNECTION_LIMIT ?? '5');
  } else if (process.env.NODE_ENV === 'development' && !url.includes('supabase.com')) {
    console.warn(
      '[database] DATABASE_URL is not a Neon pooler URL (-pooler.). Use the pooled URL from Neon Console to avoid idle disconnect errors.'
    );
  }

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
    /kind: Closed/i.test(msg) ||
    /Server has closed the connection/i.test(msg)
  );
}

/** Neon quota / plan expired / pool unavailable — skip DB and email lead directly. */
export function isDatabaseUnavailableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string; name?: string };
  const msg = String(e.message ?? err);
  if (isPrismaConnectionError(err)) return true;
  return (
    e.code === 'P1000' ||
    e.code === 'P1002' ||
    e.code === 'P1008' ||
    e.code === 'P1011' ||
    e.code === 'P2021' ||
    e.name === 'PrismaClientInitializationError' ||
    /can't reach database/i.test(msg) ||
    /database server.*not.*running/i.test(msg) ||
    /compute time quota/i.test(msg) ||
    /project.*(suspended|inactive|disabled)/i.test(msg) ||
    /quota.*exceeded/i.test(msg) ||
    /ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i.test(msg)
  );
}

/** Background pool noise when Neon closes idle TCP connections — not a user-facing failure. */
export function isBenignPrismaConnectionLog(message: string): boolean {
  return (
    /Error in PostgreSQL connection/i.test(message) &&
    (/kind: Closed/i.test(message) || /cause: None/i.test(message))
  );
}
