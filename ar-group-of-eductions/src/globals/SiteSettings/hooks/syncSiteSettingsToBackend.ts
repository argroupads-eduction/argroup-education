import type { GlobalAfterChangeHook } from 'payload'

import { syncGlobalToMarketingBackend } from '@/utilities/syncGlobalToMarketingBackend'

export const syncSiteSettingsToBackend: GlobalAfterChangeHook = async ({
  doc,
  req: { context },
}) => {
  if (context?.disableBackendSync) return doc
  await syncGlobalToMarketingBackend('site-settings', doc)
  return doc
}
