/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Core } from '@strapi/strapi';

type MarketingKind = 'post' | 'page';

type MarketingEntry = {
  slug?: string;
  title?: string;
  content?: string;
  publishedAt?: string | Date | null;
  [key: string]: unknown;
};

const UID_MAP: Record<string, MarketingKind> = {
  'api::post.post': 'post',
  'api::page.page': 'page',
};

function asEntry(value: unknown): MarketingEntry | null {
  if (!value || typeof value !== 'object') return null;
  return value as MarketingEntry;
}

/**
 * Strapi 5 Document Service publish/delete often bypasses classic afterUpdate/afterDelete.
 * One middleware covers Post + Page: publish → live, delete/unpublish → published:false.
 *
 * Note: context/next typed as `any` so Hostinger `strapi build` accepts documents.use Middleware.
 */
function registerMarketingDocumentSync(strapi: Core.Strapi) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { syncEntryToMarketing } = require('./utils/syncEntryToMarketing');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { loadPreparedPost, preparePostEntry } = require('./utils/preparePostForMarketingSync');

  strapi.documents.use(async (context: any, next: any) => {
    const kind = UID_MAP[context?.uid as string];
    const params = (context?.params || {}) as { documentId?: string; slug?: string };
    if (kind) {
      // Hostinger Runtime Logs pick up console.* reliably
      console.log(
        `[marketing-sync] documents action=${context?.action} uid=${context?.uid}`
      );
    }
    let preDeleteSlug: string | null = null;
    let preDeleteTitle: string | null = null;

    if (kind && (context.action === 'delete' || context.action === 'unpublish')) {
      try {
        if (params.documentId) {
          const prior = asEntry(
            await strapi.db.query(context.uid).findOne({
              where: { documentId: params.documentId },
            })
          );
          preDeleteSlug = typeof prior?.slug === 'string' ? prior.slug : null;
          preDeleteTitle = typeof prior?.title === 'string' ? prior.title : null;
        }
      } catch {
        /* ignore */
      }
    }

    const result = await next();
    if (!kind) return result;

    const action = String(context.action || '');
    if (!['publish', 'update', 'create', 'unpublish', 'delete'].includes(action)) {
      return result;
    }

    try {
      const raw = Array.isArray(result) ? result[0] : result;
      const entry = asEntry(raw);

      if (action === 'delete' || action === 'unpublish') {
        const slug =
          (typeof entry?.slug === 'string' && entry.slug) ||
          preDeleteSlug ||
          params.slug ||
          null;
        if (!slug) {
          strapi.log.warn(`[marketing-sync] ${kind} ${action}: no slug to unpublish`);
          return result;
        }
        await syncEntryToMarketing(
          strapi,
          kind,
          {
            slug,
            title:
              (typeof entry?.title === 'string' && entry.title) ||
              preDeleteTitle ||
              slug,
            content: typeof entry?.content === 'string' ? entry.content : '',
          },
          { published: false, notifyPush: false }
        );
        return result;
      }

      if (!entry || typeof entry.slug !== 'string' || !entry.slug) return result;

      const published = entry.publishedAt != null || action === 'publish';
      if (!published) {
        // Draft create/update must NEVER unpublish live BlogPost.
        // Strapi 5 often fires draft `update` after Publish; syncing published:false
        // wiped new posts (force-sync worked, Publish looked "dead").
        console.log(
          `[marketing-sync] skip draft ${action} for ${entry.slug} (live untouched)`
        );
        return result;
      }

      // Posts: re-load with featuredMedia + normalize HTML/h2/h3/FAQ before sync
      let syncPayload: MarketingEntry = entry;
      if (kind === 'post') {
        const documentId =
          (typeof (entry as { documentId?: string }).documentId === 'string' &&
            (entry as { documentId?: string }).documentId) ||
          params.documentId ||
          null;
        const prepared = documentId
          ? await loadPreparedPost(strapi, documentId, { preferPublished: true })
          : preparePostEntry(strapi, entry);
        if (prepared) syncPayload = prepared;
      }

      const notifyPush = kind === 'post' && action === 'publish';
      await syncEntryToMarketing(strapi, kind, syncPayload, { published: true, notifyPush });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      strapi.log.error(`[marketing-sync] documents middleware: ${message}`);
    }
    return result;
  });

  strapi.log.info(
    '[marketing-sync] documents middleware registered for api::post.post + api::page.page (publish/unpublish/delete)'
  );
}

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    try {
      registerMarketingDocumentSync(strapi);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      strapi.log.error(`[marketing-sync] register failed (CMS still boots): ${message}`);
    }
  },

  bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const syncUrl = process.env.MARKETING_SYNC_URL || '';
    const secret = process.env.PAYLOAD_SYNC_SECRET || process.env.REVALIDATE_SECRET || '';
    const allow = process.env.STRAPI_ALLOW_LIVE_SYNC || '';
    const origin = process.env.MARKETING_SYNC_ORIGIN || '';
    const host = process.env.MARKETING_SYNC_HOST || '';
    const db = process.env.MARKETING_DATABASE_URL || '';
    const line = `[marketing-sync] boot url=${syncUrl ? 'set' : 'MISSING'} secret=${secret ? 'set' : 'MISSING'} allow=${allow || 'MISSING'} origin=${origin ? 'set' : 'MISSING'} host=${host || 'MISSING'} marketingDb=${db ? 'set' : 'MISSING'}`;
    console.log(line);
    strapi.log.info(line);
    if ((!syncUrl || !secret || allow !== '1') && !db) {
      console.error(
        '[marketing-sync] Publish will NOT reach www — set MARKETING_DATABASE_URL (marketing DATABASE_URL) OR sync URL+secret+allow=1'
      );
    }
  },
};
