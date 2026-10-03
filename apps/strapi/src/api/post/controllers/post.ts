/**
 * post controller
 */
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::post.post', ({ strapi }) => ({
  async forceMarketingSync(ctx) {
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

    console.log(`[marketing-sync] force-marketing-sync slug=${slug}`);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { loadPreparedPost } = require('../../../utils/preparePostForMarketingSync');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { syncEntryToMarketing } = require('../../../utils/syncEntryToMarketing');

    let documentId: string | null = null;
    try {
      const found = await strapi.documents('api::post.post').findMany({
        filters: { slug: { $eq: slug } },
        status: 'published',
        limit: 1,
      });
      const row = Array.isArray(found) ? found[0] : null;
      documentId = row?.documentId || null;
    } catch (err) {
      console.error('[marketing-sync] force find published failed', err);
    }

    if (!documentId) {
      try {
        const found = await strapi.documents('api::post.post').findMany({
          filters: { slug: { $eq: slug } },
          status: 'draft',
          limit: 1,
        });
        const row = Array.isArray(found) ? found[0] : null;
        documentId = row?.documentId || null;
      } catch {
        /* ignore */
      }
    }

    if (!documentId) {
      return ctx.notFound(`No post for slug=${slug}`);
    }

    const prepared = await loadPreparedPost(strapi, documentId, {
      preferPublished: true,
    });
    if (!prepared) {
      return ctx.notFound(`Could not load post documentId=${documentId}`);
    }

    const result = await syncEntryToMarketing(strapi, 'post', prepared, {
      published: true,
      notifyPush: false,
    });

    console.log(`[marketing-sync] force result`, result);
    ctx.body = {
      ok: !!result?.ok,
      slug,
      documentId,
      result,
    };
  },
}));
