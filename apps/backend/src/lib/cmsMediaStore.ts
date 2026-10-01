import { createHash } from 'crypto';
import { prisma, withPrismaRetry } from './prisma';

let tableReady: Promise<void> | null = null;

async function ensureCmsMediaTable(): Promise<void> {
  if (!tableReady) {
    tableReady = withPrismaRetry(() =>
      prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS CmsMedia (
          id VARCHAR(64) NOT NULL PRIMARY KEY,
          mime VARCHAR(120) NOT NULL,
          data LONGBLOB NOT NULL,
          createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `)
    ).then(() => undefined);
  }
  await tableReady;
}

export async function storeCmsMediaBase64(
  base64: string,
  mime: string | null | undefined
): Promise<{ id: string; mime: string } | null> {
  const cleaned = String(base64 || '').replace(/^data:[^;]+;base64,/i, '').trim();
  if (!cleaned || cleaned.length < 32) return null;

  let buf: Buffer;
  try {
    buf = Buffer.from(cleaned, 'base64');
  } catch {
    return null;
  }
  if (buf.length < 32 || buf.length > 8_000_000) return null;

  const safeMime =
    typeof mime === 'string' && /^image\/(webp|png|jpeg|jpg|gif)$/i.test(mime)
      ? mime.toLowerCase().replace('image/jpg', 'image/jpeg')
      : 'image/webp';

  const id = createHash('sha256').update(buf).digest('hex').slice(0, 40);
  await ensureCmsMediaTable();
  await withPrismaRetry(() =>
    prisma.$executeRawUnsafe(
      `INSERT INTO CmsMedia (id, mime, data) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE mime = VALUES(mime), data = VALUES(data)`,
      id,
      safeMime,
      buf
    )
  );
  return { id, mime: safeMime };
}

export async function readCmsMedia(
  id: string
): Promise<{ mime: string; data: Buffer } | null> {
  if (!/^[a-f0-9]{16,64}$/i.test(id)) return null;
  await ensureCmsMediaTable();
  const rows = (await withPrismaRetry(() =>
    prisma.$queryRawUnsafe<{ mime: string; data: Buffer }[]>(
      `SELECT mime, data FROM CmsMedia WHERE id = ? LIMIT 1`,
      id
    )
  )) as { mime: string; data: Buffer }[];
  const row = rows?.[0];
  if (!row?.data) return null;
  return { mime: row.mime, data: Buffer.from(row.data) };
}

export function cmsMediaPublicUrl(id: string): string {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.PUBLIC_URL ||
    'https://www.argroupofeducation.com'
  ).replace(/\/$/, '');
  return `${base}/api/cms/media/${id}`;
}
