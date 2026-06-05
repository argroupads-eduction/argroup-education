import type { GlobalAfterChangeHook } from 'payload'

import { syncGlobalToMarketingBackend } from '@/utilities/syncGlobalToMarketingBackend'

export function createGlobalBackendSyncHook(slug: string): GlobalAfterChangeHook {
  return async ({ doc, req: { context } }) => {
    if (context?.disableBackendSync) return doc
    await syncGlobalToMarketingBackend(slug, doc as Record<string, unknown>)
    return doc
  }
}
