import type { Core } from '@strapi/strapi';

/**
 * Strapi 5 Document Service publish often bypasses classic afterUpdate.
 * Middleware ensures every post publish/update reaches marketing BlogPost.
 */
function registerPostMarketingSync(strapi: Core.Strapi) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { syncPostToMarketing } = require('./utils/syncPostToMarketing');

  strapi.documents.use(async (context, next) => {
    const result = await next();
    if (context.uid !== 'api::post.post') return result;

    const action = context.action;
    if (!['publish', 'update', 'create'].includes(action)) return result;

    try {
      const entry = Array.isArray(result) ? result[0] : result;
      if (!entry?.slug) return result;

      const published = entry.publishedAt != null || action === 'publish';
      if (!published && action !== 'publish') return result;

      // publish action = first go-live notify; update while published = silent sync
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
