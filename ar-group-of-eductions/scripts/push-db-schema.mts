/**
 * One-off: sync Drizzle schema to Neon (menu tables, new fields).
 * Usage: PAYLOAD_DATABASE_PUSH=true npx tsx scripts/push-db-schema.mts
 */
import 'dotenv/config'
process.env.PAYLOAD_DATABASE_PUSH = 'true'

import { getPayload } from 'payload'
import config from '@payload-config'

async function main() {
  await getPayload({ config })
  console.log('[push-db-schema] Schema push finished.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
