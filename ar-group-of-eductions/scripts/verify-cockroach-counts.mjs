import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config({ path: new URL('../.env', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1') })
// Windows path from fileURL - simpler:
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const dir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(dir, '..', '.env') })

const url = process.env.DATABASE_URL
if (!url) {
  console.error('no DATABASE_URL')
  process.exit(1)
}
const c = new pg.Client({
  connectionString: url.replace(/[?&]sslmode=[^&]*/gi, ''),
  ssl: { rejectUnauthorized: true },
})
await c.connect()
const cms = await c.query(`
  SELECT
    (SELECT count(*)::int FROM cms.posts) AS posts,
    (SELECT count(*)::int FROM cms.pages) AS pages,
    (SELECT count(*)::int FROM cms.media) AS media,
    (SELECT count(*)::int FROM cms.users) AS users
`)
const pub = await c.query(`
  SELECT
    (SELECT count(*)::int FROM "BlogPost") AS blog,
    (SELECT count(*)::int FROM "WebsiteFormLead") AS leads,
    (SELECT count(*)::int FROM "NeetRankPredictorSubmission") AS neet,
    (SELECT count(*)::int FROM "PushSubscription") AS push
`)
console.log('host', new URL(url).hostname)
console.log('cms', cms.rows[0])
console.log('public', pub.rows[0])
await c.end()
