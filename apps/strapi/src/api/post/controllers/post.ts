/**
 * post controller + force marketing sync
 */
import { factories } from '@strapi/strapi';

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

      console.log(`[marketing-sync] force-marketing-sync start slug=${slug}`);

      // Prefer DB lookup — more reliable than documents API on Hostinger
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
      const documentId = entry.documentId || null;

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { preparePostEntry, loadPreparedPost } = require('../../../utils/preparePostForMarketingSync');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { syncEntryToMarketing } = require('../../../utils/syncEntryToMarketing');

      let prepared = documentId
        ? await loadPreparedPost(strapi, documentId, { preferPublished: true })
        : null;
      if (!prepared) {
        prepared = preparePostEntry(strapi, entry);
      }
      if (!prepared) {
        return ctx.notFound(`Could not prepare post slug=${slug}`);
      }

      // Ensure published flag for sync
      if (!prepared.publishedAt) {
        prepared.publishedAt = entry.publishedAt || new Date().toISOString();
      }

      const result = await syncEntryToMarketing(strapi, 'post', prepared, {
        published: true,
        notifyPush: false,
      });

      console.log(`[marketing-sync] force result`, JSON.stringify(result));
      ctx.body = {
        ok: !!result?.ok,
        slug,
        documentId,
        publishedAt: prepared.publishedAt,
        contentLen: String(prepared.content || '').length,
        result,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[marketing-sync] force exception: ${message}`);
      if (err instanceof Error && err.stack) console.error(err.stack);
      ctx.status = 500;
      ctx.body = { ok: false, error: message };
    }
  },
}));
