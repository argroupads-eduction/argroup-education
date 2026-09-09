/**
 * Copy Prisma public schema tables: Supabase → CockroachDB.
 * Creates missing tables via Prisma db push first (run separately).
 * Never prints connection strings/passwords.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const logPath = path.join(root, 'backups', 'public_node_migrate.log')

const TABLES = [
  'AdminUser',
  'BlogPost',
  'SitePage',
  'Country',
  'University',
  'NeetRankPredictorSubmission',
  'WebsiteFormLead',
  'Lead',
  'Subscriber',
  'ContactSubmission',
  'Testimonial',
  'GalleryImage',
  'SiteGlobal',
  'PushSubscription',
]

function loadEnv(file, override = false) {
  if (fs.existsSync(file)) dotenv.config({ path: file, override })
}

function envUrl(...keys) {
  for (const k of keys) {
    const v = process.env[k]?.trim().replace(/^["']|["']$/g, '')
    if (v) return { key: k, url: v }
  }
  return null
}

function redact(s) {
  return String(s)
    .replace(/postgresql:\/\/[^\s"']+/gi, 'postgresql://***')
    .replace(/:[^:@/\s]+@/g, ':***@')
}

function hostOf(url) {
  try {
    return new URL(url).hostname
  } catch {
    return '?'
  }
}

function isCockroach(url) {
  return /cockroachlabs\.cloud|:26257/i.test(url)
}

function stripSslMode(url) {
  try {
    const u = new URL(url)
    u.searchParams.delete('sslmode')
    u.searchParams.delete('uselibpqcompat')
    return u.toString()
  } catch {
    return url
  }
}

function clientConfig(url) {
  const cfg = {
    connectionString: stripSslMode(url),
    connectionTimeoutMillis: 30_000,
  }
  if (isCockroach(url)) cfg.ssl = { rejectUnauthorized: true }
  else cfg.ssl = { rejectUnauthorized: false }
  return cfg
}

function qid(name) {
  return `"${String(name).replace(/"/g, '""')}"`
}

async function tableExists(client, schema, table) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema=$1 AND table_name=$2 LIMIT 1`,
    [schema, table],
  )
  return rows.length > 0
}

async function columns(client, schema, table) {
  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema=$1 AND table_name=$2 ORDER BY ordinal_position`,
    [schema, table],
  )
  return rows.map((r) => r.column_name)
}

async function countRows(client, schema, table) {
  const { rows } = await client.query(`SELECT count(*)::int AS n FROM ${qid(schema)}.${qid(table)}`)
  return rows[0].n
}

async function copyTable(src, dst, table, log) {
  if (!(await tableExists(src, 'public', table))) {
    log(`SKIP ${table}: missing on source`)
    return { table, skipped: true }
  }
  if (!(await tableExists(dst, 'public', table))) {
    log(`SKIP ${table}: missing on dest (run prisma db push first)`)
    return { table, skipped: true }
  }

  const srcCols = await columns(src, 'public', table)
  const dstCols = new Set(await columns(dst, 'public', table))
  const colNames = srcCols.filter((c) => dstCols.has(c))
  if (!colNames.length) {
    log(`SKIP ${table}: no shared columns`)
    return { table, skipped: true }
  }

  const srcCount = await countRows(src, 'public', table)
  await dst.query(`TRUNCATE TABLE ${qid('public')}.${qid(table)} CASCADE`)
  if (srcCount === 0) {
    log(`OK ${table}: 0 rows`)
    return { table, copied: 0, srcCount: 0, dstCount: 0 }
  }

  const selectList = colNames.map(qid).join(', ')
  const insertList = colNames.map(qid).join(', ')
  const { rows } = await src.query(`SELECT ${selectList} FROM ${qid('public')}.${qid(table)}`)

  const batchSize = 40
  let copied = 0
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const values = []
    const placeholders = batch.map((row, bi) => {
      const cells = colNames.map((name, ci) => {
        values.push(row[name])
        return `$${bi * colNames.length + ci + 1}`
      })
      return `(${cells.join(',')})`
    })
    try {
      await dst.query(
        `INSERT INTO ${qid('public')}.${qid(table)} (${insertList}) VALUES ${placeholders.join(',')}`,
        values,
      )
      copied += batch.length
    } catch (err) {
      for (const row of batch) {
        const rowVals = colNames.map((n) => row[n])
        const ph = colNames.map((_, idx) => `$${idx + 1}`).join(',')
        try {
          await dst.query(
            `INSERT INTO ${qid('public')}.${qid(table)} (${insertList}) VALUES (${ph})`,
            rowVals,
          )
          copied += 1
        } catch (rowErr) {
          log(`FAIL ${table} id=${row.id ?? '?'}: ${redact(rowErr.message).slice(0, 220)}`)
        }
      }
    }
  }

  const dstCount = await countRows(dst, 'public', table)
  log(`OK ${table}: src=${srcCount} dst=${dstCount} inserted=${copied}`)
  return { table, copied, srcCount, dstCount }
}

async function main() {
  fs.mkdirSync(path.join(root, 'backups'), { recursive: true })
  const lines = []
  const log = (msg) => {
    const line = `[${new Date().toISOString()}] ${msg}`
    lines.push(line)
    console.log(msg)
  }

  // Source = Supabase from backend env (load first)
  loadEnv(path.join(root, 'apps', 'backend', '.env.supabase.bak'), false)
  loadEnv(path.join(root, 'apps', 'backend', '.env'), false)
  const srcInfo = envUrl('DATABASE_URL_UNPOOLED', 'DATABASE_URL')

  // Dest = Cockroach
  loadEnv(path.join(root, 'ar-group-of-eductions', '.env.cockroachdb'), true)
  const dstInfo = envUrl('DATABASE_URL')

  if (!srcInfo || !dstInfo) {
    console.error('Missing source/dest URL')
    process.exit(1)
  }
  if (!isCockroach(dstInfo.url) || isCockroach(srcInfo.url)) {
    console.error('Safety check failed: dest must be Cockroach, source must not')
    process.exit(1)
  }

  log(`Source env=${srcInfo.key} host=${hostOf(srcInfo.url)}`)
  log(`Dest host=${hostOf(dstInfo.url)}`)

  const src = new pg.Client(clientConfig(srcInfo.url))
  const dst = new pg.Client(clientConfig(dstInfo.url))
  await src.connect()
  await dst.connect()
  log('Connected')

  for (const table of TABLES) {
    try {
      await copyTable(src, dst, table, log)
    } catch (err) {
      log(`ERROR ${table}: ${redact(err.message).slice(0, 300)}`)
    }
  }

  log('--- key counts ---')
  for (const t of ['BlogPost', 'SitePage', 'Country', 'University', 'WebsiteFormLead', 'Lead']) {
    try {
      if (await tableExists(dst, 'public', t)) log(`${t}=${await countRows(dst, 'public', t)}`)
      else log(`${t}=missing`)
    } catch (e) {
      log(`${t}=ERR`)
    }
  }

  await src.end()
  await dst.end()
  fs.writeFileSync(logPath, lines.join('\n'), 'utf8')
  log(`Wrote ${logPath}`)
}

main().catch((e) => {
  console.error(redact(e.stack || e.message))
  process.exit(1)
})
