/**
 * Neon / Supabase / Hostinger MySQL URL helpers for Prisma.
 */
export function getDatabaseProviderLabel(raw?: string): string {
  const url = raw?.trim() ?? process.env.DATABASE_URL?.trim() ?? '';
  if (/^mysql:\/\//i.test(url) || url.includes('hstgr.io') || url.includes('hostinger')) {
    return 'Hostinger MySQL';
  }
  if (url.includes('supabase.com')) return 'Supabase';
  if (url.includes('.neon.tech')) return 'Neon';
  if (url.includes('cockroachlabs.cloud') || url.includes('cockroachdb')) return 'Cockroach';
  return 'Postgres';
}

function isMysqlUrl(url: string): boolean {
  return /^mysql:\/\//i.test(url);
}

export function neonDatabaseUrl(raw?: string): string {
  if (!raw?.trim()) {
    throw new Error(
      'DATABASE_URL is missing. Set Hostinger MySQL URL, e.g. mysql://USER:PASS@HOST:3306/DB'
    );
  }

  let url = raw.trim().replace(/^["']|["']$/g, '');

  // Hostinger MySQL — do not append Postgres/Neon query params.
  if (isMysqlUrl(url)) {
    return url;
  }

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
    ensureParam('connection_limit', process.env.PRISMA_CONNECTION_LIMIT ?? '5');
  } else if (process.env.NODE_ENV === 'development' && !url.includes('supabase.com')) {
    console.warn(
      '[database] Prefer Hostinger MySQL (mysql://…) for production. Legacy Postgres URLs still work locally.'
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
    /Error in MySQL connection/i.test(msg) ||
    /kind: Closed/i.test(msg) ||
    /Server has closed the connection/i.test(msg)
  );
}

/** Quota / plan expired / pool unavailable — skip DB and email lead directly. */
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
