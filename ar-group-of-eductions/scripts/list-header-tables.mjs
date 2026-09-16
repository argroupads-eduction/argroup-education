import 'dotenv/config'
import pg from 'pg'

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()
const r = await client.query(
  `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'header%' ORDER BY 1`,
)
console.log(r.rows.map((x) => x.tablename).join('\n') || '(none)')
await client.end()
