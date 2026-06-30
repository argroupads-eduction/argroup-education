import type { PayloadRequest } from 'payload'

import { syncToMarketingBackend } from './syncToMarketingBackend'

export function isAutosaveRequest(req: PayloadRequest): boolean {
  if (req.query?.autosave === true || req.query?.autosave === 'true') return true
  const url = typeof req.url === 'string' ? req.url : ''
  return /[?&]autosave=true(?:&|$)/i.test(url)
}

/** Fire-and-forget marketing sync so Publish/Save returns immediately in the admin UI. */
export function enqueueMarketingContentSync(
  req: PayloadRequest,
  payload: Parameters<typeof syncToMarketingBackend>[0],
): void {
  void syncToMarketingBackend(payload).catch((err) => {
    req.payload.logger.error(
      { err, slug: payload.slug, type: payload.type },
      '[payload→backend sync] background sync failed',
    )
  })
}
