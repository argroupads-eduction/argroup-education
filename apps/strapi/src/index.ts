import type { Core } from '@strapi/strapi';

/**
 * Strapi 5 Document Service publish often bypasses classic afterUpdate.
 * Middleware ensures every post publish/update reaches marketing BlogPost.
 */
function registerPostMarketingSync(strapi: Core.Strapi) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { syncPostToMarketing } = require('./utils/syncPostToMarketing');

  strapi.documents.use(async (context, next) => {
    // Capture slug before delete (result may be empty)
    const params = (context as { params?: { documentId?: string; slug?: string } }).params || {};
    let preDeleteSlug: string | null = null;
    if (context.uid === 'api::post.post' && (context.action === 'delete' || context.action === 'unpublish')) {
      try {
        if (params.documentId) {
          const prior = await strapi.db.query('api::post.post').findOne({
            where: { documentId: params.documentId },
          });
          preDeleteSlug = prior?.slug || null;
        }
      } catch {
        /* ignore */
      }
    }

    const result = await next();
    if (context.uid !== 'api::post.post') return result;

    const action = context.action;
    if (!['publish', 'update', 'create', 'unpublish', 'delete'].includes(action)) {
      return result;
    }

    try {
      const entry = Array.isArray(result) ? result[0] : result;

      // Delete / Unpublish → hide on live (published:false, never hard-delete marketing row)
      if (action === 'delete' || action === 'unpublish') {
        const slug = entry?.slug || preDeleteSlug || params.slug;
        if (!slug) {
          strapi.log.warn(`[marketing-sync] ${action}: no slug to unpublish`);
          return result;
        }
        await syncPostToMarketing(
          strapi,
          { slug, title: entry?.title || slug, content: entry?.content || '' },
          { published: false, notifyPush: false }
        );
        return result;
      }

      if (!entry?.slug) return result;

      const published = entry.publishedAt != null || action === 'publish';
      if (!published) {
        await syncPostToMarketing(strapi, entry, { published: false, notifyPush: false });
        return result;
      }

      const notifyPush = action === 'publish';
      await syncPostToMarketing(strapi, entry, { published: true, notifyPush });
    } catch (err: any) {
      strapi.log.error(`[marketing-sync] documents middleware: ${err?.message || err}`);
    }
    return result;
  });

  strapi.log.info('[marketing-sync] documents middleware registered for api::post.post');
}

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    registerPostMarketingSync(strapi);
  },

  bootstrap(/* { strapi }: { strapi: Core.Strapi } */) {},
};
