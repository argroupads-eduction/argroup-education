/**
 * post controller + force marketing sync
 */
import path from 'node:path';
import { createRequire } from 'node:module';
import { factories } from '@strapi/strapi';

const requireFromApp = createRequire(path.join(process.cwd(), 'package.json'));

function loadSyncUtils() {
  const candidates = [
    path.join(process.cwd(), 'src/utils/preparePostForMarketingSync.js'),
    path.join(process.cwd(), 'dist/src/utils/preparePostForMarketingSync.js'),
    path.join(process.cwd(), 'src/utils/preparePostForMarketingSync'),
  ];
  let prepareMod: {
    preparePostEntry: (strapi: unknown, entry: unknown) => unknown;
    loadPreparedPost: (
      strapi: unknown,
      documentId: string,
      opts?: { preferPublished?: boolean }
    ) => Promise<unknown>;
  } | null = null;
  let syncMod: {
    syncEntryToMarketing: (
      strapi: unknown,
      type: string,
      entry: unknown,
      opts?: { published?: boolean; notifyPush?: boolean }
    ) => Promise<{ ok?: boolean }>;
  } | null = null;

  for (const p of candidates) {
    try {
      prepareMod = requireFromApp(p);
      break;
    } catch {
      /* try next */
    }
  }
  const syncCandidates = [
    path.join(process.cwd(), 'src/utils/syncEntryToMarketing.js'),
    path.join(process.cwd(), 'dist/src/utils/syncEntryToMarketing.js'),
    path.join(process.cwd(), 'src/utils/syncEntryToMarketing'),
  ];
  for (const p of syncCandidates) {
    try {
      syncMod = requireFromApp(p);
      break;
    } catch {
      /* try next */
    }
  }
  if (!prepareMod || !syncMod) {
    throw new Error(
      `sync utils not found under ${process.cwd()} (src/utils or dist/src/utils)`
    );
  }
  return { prepareMod, syncMod };
}

export default factories.createCoreController('api::post.post', ({ strapi }) => ({
  async forceMarketingSync(ctx) {
    try {
      const auth = String(ctx.request.header.authorization || '');
      const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
      const secret = (
        process.env.PAYLOAD_SYNC_SECRET ||
        process.env.REVALIDATE_SECRET ||
        ''
      ).trim();
      if (!secret || !token || token !== secret) {
        return ctx.unauthorized('Unauthorized');
      }

      const body = ctx.request.body || {};
      const slugIn =
        (typeof body.slug === 'string' && body.slug.trim()) ||
        (typeof ctx.query?.slug === 'string' && String(ctx.query.slug).trim()) ||
        '';
      const documentIdIn =
        (typeof body.documentId === 'string' && body.documentId.trim()) ||
        (typeof ctx.query?.documentId === 'string' && String(ctx.query.documentId).trim()) ||
        '';
      const titleContains =
        (typeof body.titleContains === 'string' && body.titleContains.trim()) ||
        (typeof ctx.query?.titleContains === 'string' && String(ctx.query.titleContains).trim()) ||
        '';
      const syncRecent = Math.min(
        10,
        Math.max(0, Number(body.syncRecent || ctx.query?.syncRecent || 0) || 0)
      );

      console.log(
        `[marketing-sync] force-marketing-sync start slug=${slugIn || '-'} documentId=${documentIdIn || '-'} titleContains=${titleContains || '-'} recent=${syncRecent} cwd=${process.cwd()}`
      );

      let rows: Record<string, unknown>[] = [];
      if (documentIdIn) {
        rows = await strapi.db.query('api::post.post').findMany({
          where: { documentId: documentIdIn },
          orderBy: { updatedAt: 'desc' },
          limit: 5,
          populate: ['featuredMedia'],
        });
      } else if (slugIn) {
        rows = await strapi.db.query('api::post.post').findMany({
          where: { slug: slugIn },
          orderBy: { updatedAt: 'desc' },
          limit: 5,
          populate: ['featuredMedia'],
        });
      } else if (titleContains) {
        // Strapi db layer: $containsi on title
        rows = await strapi.db.query('api::post.post').findMany({
          where: { title: { $containsi: titleContains } },
          orderBy: { updatedAt: 'desc' },
          limit: 8,
          populate: ['featuredMedia'],
        });
      } else if (syncRecent > 0) {
        rows = await strapi.db.query('api::post.post').findMany({
          where: { publishedAt: { $notNull: true } },
          orderBy: { updatedAt: 'desc' },
          limit: syncRecent,
          populate: ['featuredMedia'],
        });
      } else {
        return ctx.badRequest('slug, documentId, titleContains, or syncRecent is required');
      }

      if (!rows?.length) {
        console.error(`[marketing-sync] force: no rows matched`);
        return ctx.notFound('No matching post');
      }

      const { prepareMod, syncMod } = loadSyncUtils();
      const synced: Array<Record<string, unknown>> = [];

      // Dedupe by documentId / slug — prefer published row
      const byKey = new Map<string, Record<string, unknown>>();
      for (const r of rows) {
        const key = String(r.documentId || r.slug || '');
        if (!key) continue;
        const prev = byKey.get(key);
        if (!prev || (r.publishedAt && !prev.publishedAt)) byKey.set(key, r);
      }

      for (const entry of byKey.values()) {
        const documentId =
          typeof entry.documentId === 'string' ? entry.documentId : null;
        const slug = typeof entry.slug === 'string' ? entry.slug : '';

        let prepared =
          documentId != null
            ? await prepareMod.loadPreparedPost(strapi, documentId, {
                preferPublished: true,
              })
            : null;
        if (!prepared) {
          prepared = prepareMod.preparePostEntry(strapi, entry);
        }
        if (!prepared || typeof prepared !== 'object') {
          synced.push({ slug, documentId, ok: false, error: 'prepare failed' });
          continue;
        }

        const preparedObj = prepared as {
          publishedAt?: string;
          content?: string;
          slug?: string;
          featuredImage?: string | null;
        };
        if (!preparedObj.publishedAt) {
          preparedObj.publishedAt =
            (typeof entry.publishedAt === 'string' && entry.publishedAt) ||
            new Date().toISOString();
        }

        const result = await syncMod.syncEntryToMarketing(strapi, 'post', preparedObj, {
          published: true,
          notifyPush: false,
        });

        synced.push({
          ok: !!result?.ok,
          slug: preparedObj.slug || slug,
          documentId,
          publishedAt: preparedObj.publishedAt,
          contentLen: String(preparedObj.content || '').length,
          hasImage: Boolean(preparedObj.featuredImage),
          result,
        });
      }

      console.log(`[marketing-sync] force result`, JSON.stringify(synced));
      ctx.body = {
        ok: synced.some((s) => s.ok),
        synced,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[marketing-sync] force exception: ${message}`);
      if (err instanceof Error && err.stack) console.error(err.stack);
      ctx.status = 500;
      ctx.body = { ok: false, error: message, cwd: process.cwd() };
    }
  },
}));
