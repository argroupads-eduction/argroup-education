/**
 * One-time: push Payload collections into `cms` schema (non-interactive).
 * Usage: npx tsx scripts/bootstrap-payload-schema.mts
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

process.env.PAYLOAD_DATABASE_PUSH = 'true'
process.env.PAYLOAD_MIGRATING = 'false'

console.log('[bootstrap-payload-schema] Connecting and pushing schema to cms...')
await getPayload({ config })
console.log('[bootstrap-payload-schema] Done — check Supabase → cms schema for posts, pages, users')
