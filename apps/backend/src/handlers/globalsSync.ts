import { prisma, withPrismaRetry } from '../lib/prisma';
import { verifyPayloadSyncAuth, type PayloadSyncResult } from './payloadSync';

export type GlobalsSyncBody = {
  slug?: string;
  data?: unknown;
};

export type SiteGlobalRow = {
  slug: string;
  data: unknown;
  updatedAt: Date;
};

export async function runGlobalsSync(body: GlobalsSyncBody): Promise<PayloadSyncResult> {
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  if (!slug) {
    return { ok: false, status: 400, body: { success: false, message: 'slug is required' } };
  }
  if (body.data === undefined || body.data === null) {
    return { ok: false, status: 400, body: { success: false, message: 'data is required' } };
  }

  try {
    await withPrismaRetry(() =>
      prisma.siteGlobal.upsert({
        where: { slug },
        create: { slug, data: body.data as object },
        update: { data: body.data as object },
      })
    );
    return {
      ok: true,
      status: 200,
      body: { success: true, type: 'page', slug, published: true },
    };
  } catch (error) {
    console.error('globals-sync', error);
    return { ok: false, status: 500, body: { success: false, message: 'Globals sync failed' } };
  }
}

export async function getSiteGlobal(slug: string): Promise<SiteGlobalRow | null> {
  const row = await withPrismaRetry(() =>
    prisma.siteGlobal.findUnique({ where: { slug } })
  );
  if (!row) return null;
  return { slug: row.slug, data: row.data, updatedAt: row.updatedAt };
}

export async function getAllSiteGlobals(): Promise<SiteGlobalRow[]> {
  const rows = await withPrismaRetry(() =>
    prisma.siteGlobal.findMany({ orderBy: { slug: 'asc' } })
  );
  return rows.map((row) => ({ slug: row.slug, data: row.data, updatedAt: row.updatedAt }));
}

export { verifyPayloadSyncAuth };
