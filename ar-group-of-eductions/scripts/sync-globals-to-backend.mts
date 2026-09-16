/**
 * Sync all Payload globals → marketing backend (Neon).
 *
 * Usage:
 *   npx tsx scripts/sync-globals-to-backend.mts
 */

import 'dotenv/config';
import { getPayload } from 'payload';
import config from '@payload-config';
import { syncGlobalToMarketingBackend } from '../src/utilities/syncGlobalToMarketingBackend';

const GLOBAL_SLUGS = ['header', 'footer', 'site-settings'] as const;

async function main() {
  const payload = await getPayload({ config });
  let synced = 0;

  for (const slug of GLOBAL_SLUGS) {
    try {
      const doc = await payload.findGlobal({ slug, depth: 0 });
      await syncGlobalToMarketingBackend(slug, doc as unknown as Record<string, unknown>);
      synced++;
      console.log(`  ok ${slug}`);
    } catch (e) {
      console.error(`  fail ${slug}`, e);
    }
  }

  console.log(`Done. synced=${synced}/${GLOBAL_SLUGS.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
