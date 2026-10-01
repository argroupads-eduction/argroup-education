import type { Core } from '@strapi/strapi';

type MarketingKind = 'post' | 'page';

const UID_MAP: Record<string, MarketingKind> = {
  'api::post.post': 'post',
  'api::page.page': 'page',
};

/**
 * Strapi 5 Document Service publish/delete often bypasses classic afterUpdate/afterDelete.
 * One middleware covers Post + Page: publish → live, delete/unpublish → published:false.
 */
function registerMarketingDocumentSync(strapi: Core.Strapi) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { syncEntryToMarketing } = require('./utils/syncEntryToMarketing');

  strapi.documents.use(async (context, next) => {
    const kind = UID_MAP[context.uid];
    const params = (context as { params?: { documentId?: string; slug?: string } }).params || {};
    let preDeleteSlug: string | null = null;
    let preDeleteTitle: string | null = null;

    if (kind && (context.action === 'delete' || context.action === 'unpublish')) {
      try {
        if (params.documentId) {
          const prior = await strapi.db.query(context.uid).findOne({
            where: { documentId: params.documentId },
          });
          preDeleteSlug = prior?.slug || null;
          preDeleteTitle = prior?.title || null;
        }
      } catch {
        /* ignore */
      }
    }

    const result = await next();
    if (!kind) return result;

    const action = context.action;
    if (!['publish', 'update', 'create', 'unpublish', 'delete'].includes(action)) {
      return result;
    }

    try {
      const entry = Array.isArray(result) ? result[0] : result;

      if (action === 'delete' || action === 'unpublish') {
        const slug = entry?.slug || preDeleteSlug || params.slug;
        if (!slug) {
          strapi.log.warn(`[marketing-sync] ${kind} ${action}: no slug to unpublish`);
          return result;
        }
        await syncEntryToMarketing(
          strapi,
          kind,
          {
            slug,
            title: entry?.title || preDeleteTitle || slug,
            content: entry?.content || '',
          },
          { published: false, notifyPush: false }
        );
        return result;
      }

      if (!entry?.slug) return result;

      const published = entry.publishedAt != null || action === 'publish';
      if (!published) {
        await syncEntryToMarketing(strapi, kind, entry, {
          published: false,
          notifyPush: false,
        });
        return result;
      }

      const notifyPush = kind === 'post' && action === 'publish';
      await syncEntryToMarketing(strapi, kind, entry, { published: true, notifyPush });
    } catch (err: any) {
      strapi.log.error(`[marketing-sync] documents middleware: ${err?.message || err}`);
    }
    return result;
  });

  strapi.log.info(
    '[marketing-sync] documents middleware registered for api::post.post + api::page.page (publish/unpublish/delete)'
  );
}

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    registerMarketingDocumentSync(strapi);
  },

  bootstrap(/* { strapi }: { strapi: Core.Strapi } */) {},
};
