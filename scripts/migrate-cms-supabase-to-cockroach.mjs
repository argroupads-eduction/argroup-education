/**
 * Copy Payload cms schema data: Supabase → CockroachDB.
 * Never prints connection strings or passwords.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const logPath = path.join(root, 'backups', 'cms_node_migrate.log')

function loadEnv(file) {
  if (fs.existsSync(file)) dotenv.config({ path: file, override: false })
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

function clientConfig(url) {
  const cfg = {
    connectionString: url,
    connectionTimeoutMillis: 30_000,
    statement_timeout: 0,
  }
  if (isCockroach(url)) {
    cfg.ssl = { rejectUnauthorized: true }
  } else if (/supabase\.com/i.test(url)) {
    cfg.ssl = { rejectUnauthorized: false }
  } else {
    cfg.ssl = { rejectUnauthorized: false }
  }
  return cfg
}

async function listBaseTables(client, schema) {
  const { rows } = await client.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = $1 AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
    [schema],
  )
  return rows.map((r) => r.table_name)
}

async function tableColumns(client, schema, table) {
  const { rows } = await client.query(
    `SELECT column_name, data_type, udt_name
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position`,
    [schema, table],
  )
  return rows
}

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`
}

async function countRows(client, schema, table) {
  const { rows } = await client.query(`SELECT count(*)::int AS n FROM ${quoteIdent(schema)}.${quoteIdent(table)}`)
  return rows[0].n
}

async function copyTable(src, dst, schema, table, log) {
  const cols = await tableColumns(src, schema, table)
  if (!cols.length) {
    log(`SKIP ${table}: no columns on source`)
    return { table, copied: 0, skipped: true }
  }

  const colNames = cols.map((c) => c.column_name)
  const selectList = colNames.map(quoteIdent).join(', ')
  const insertList = colNames.map(quoteIdent).join(', ')

  const srcCount = await countRows(src, schema, table)
  await dst.query(`TRUNCATE TABLE ${quoteIdent(schema)}.${quoteIdent(table)} CASCADE`)

  if (srcCount === 0) {
    log(`OK ${table}: 0 rows`)
    return { table, copied: 0 }
  }

  const { rows } = await src.query(`SELECT ${selectList} FROM ${quoteIdent(schema)}.${quoteIdent(table)}`)
  const batchSize = 50
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

    const sql = `INSERT INTO ${quoteIdent(schema)}.${quoteIdent(table)} (${insertList}) VALUES ${placeholders.join(',')}`
    try {
      await dst.query(sql, values)
      copied += batch.length
    } catch (err) {
      // Fall back to row-by-row for this batch
      for (const row of batch) {
        const rowVals = colNames.map((n) => row[n])
        const ph = colNames.map((_, idx) => `$${idx + 1}`).join(',')
        try {
          await dst.query(
            `INSERT INTO ${quoteIdent(schema)}.${quoteIdent(table)} (${insertList}) VALUES (${ph})`,
            rowVals,
          )
          copied += 1
        } catch (rowErr) {
          const id = row.id ?? rowVals[0]
          log(`FAIL ${table} id=${id}: ${redact(rowErr.message).slice(0, 240)}`)
        }
      }
    }
  }

  const dstCount = await countRows(dst, schema, table)
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

  loadEnv(path.join(root, 'ar-group-of-eductions', '.env.cockroachdb'))
  loadEnv(path.join(root, 'apps', 'backend', '.env'))
  loadEnv(path.join(root, 'ar-group-of-eductions', '.env'))

  const srcInfo = envUrl('DATABASE_URL_UNPOOLED', 'DATABASE_URL')
  // Force destination from cockroach file only
  dotenv.config({ path: path.join(root, 'ar-group-of-eductions', '.env.cockroachdb'), override: true })
  const dstInfo = envUrl('DATABASE_URL')

  if (!srcInfo || !dstInfo) {
    console.error('Missing source or destination DATABASE_URL')
    process.exit(1)
  }
  if (!isCockroach(dstInfo.url)) {
    console.error('Destination is not Cockroach — aborting for safety')
    process.exit(1)
  }
  if (isCockroach(srcInfo.url)) {
    console.error('Source looks like Cockroach — aborting for safety')
    process.exit(1)
  }

  log(`Source env=${srcInfo.key} host=${hostOf(srcInfo.url)}`)
  log(`Dest host=${hostOf(dstInfo.url)}`)

  const src = new pg.Client(clientConfig(srcInfo.url))
  const dst = new pg.Client(clientConfig(dstInfo.url))
  await src.connect()
  await dst.connect()
  log('Connected')

  // Prefer table list from destination (schema already restored)
  let tables = await listBaseTables(dst, 'cms')
  if (!tables.length) tables = await listBaseTables(src, 'cms')
  log(`Tables: ${tables.length}`)

  // Parent-ish tables first (users/media before posts/pages)
  const priority = [
    'users',
    'users_sessions',
    'media',
    'categories',
    'categories_breadcrumbs',
    'posts',
    'pages',
    'header',
    'footer',
    'forms',
  ]
  tables.sort((a, b) => {
    const ia = priority.indexOf(a)
    const ib = priority.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

  const results = []
  for (const table of tables) {
    try {
      results.push(await copyTable(src, dst, 'cms', table, log))
    } catch (err) {
      log(`ERROR ${table}: ${redact(err.message).slice(0, 300)}`)
      results.push({ table, error: true })
    }
  }

  const key = ['posts', 'pages', 'media', 'users', 'categories']
  log('--- key counts ---')
  for (const t of key) {
    try {
      const n = await countRows(dst, 'cms', t)
      log(`${t}=${n}`)
    } catch (e) {
      log(`${t}=ERR ${redact(e.message).slice(0, 120)}`)
    }
  }

  await src.end()
  await dst.end()
  fs.writeFileSync(logPath, lines.join('\n'), 'utf8')
  log(`Wrote ${logPath}`)
}

main().catch((err) => {
  console.error(redact(err.stack || err.message))
  process.exit(1)
})
