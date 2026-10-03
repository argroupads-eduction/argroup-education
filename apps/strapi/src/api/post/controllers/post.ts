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

      const slug =
        (typeof ctx.request.body?.slug === 'string' && ctx.request.body.slug.trim()) ||
        (typeof ctx.query?.slug === 'string' && String(ctx.query.slug).trim()) ||
        '';
      if (!slug) {
        return ctx.badRequest('slug is required');
      }

      console.log(`[marketing-sync] force-marketing-sync start slug=${slug} cwd=${process.cwd()}`);

      const rows = await strapi.db.query('api::post.post').findMany({
        where: { slug },
        orderBy: { updatedAt: 'desc' },
        limit: 5,
        populate: ['featuredMedia'],
      });

      if (!rows?.length) {
        console.error(`[marketing-sync] force: no rows for slug=${slug}`);
        return ctx.notFound(`No post for slug=${slug}`);
      }

      const published = rows.find((r: { publishedAt?: string | null }) => r.publishedAt != null);
      const entry = published || rows[0];
      const documentId =
        typeof entry.documentId === 'string' ? entry.documentId : null;

      const { prepareMod, syncMod } = loadSyncUtils();

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
        return ctx.notFound(`Could not prepare post slug=${slug}`);
      }

      const preparedObj = prepared as { publishedAt?: string; content?: string };
      if (!preparedObj.publishedAt) {
        preparedObj.publishedAt =
          (entry as { publishedAt?: string }).publishedAt || new Date().toISOString();
      }

      const result = await syncMod.syncEntryToMarketing(strapi, 'post', preparedObj, {
        published: true,
        notifyPush: false,
      });

      console.log(`[marketing-sync] force result`, JSON.stringify(result));
      ctx.body = {
        ok: !!result?.ok,
        slug,
        documentId,
        publishedAt: preparedObj.publishedAt,
        contentLen: String(preparedObj.content || '').length,
        result,
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
