import { NextResponse } from 'next/server'
import { resolveDatabasePoolConfig } from '@/utilities/resolveDatabaseUrl'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function envSet(name: string): boolean {
  return Boolean(process.env[name]?.trim())
}

function databaseHost(): string {
  const raw = process.env.DATABASE_URL?.trim() ?? ''
  if (raw.includes('supabase.com')) return 'supabase'
  if (raw.includes('.neon.tech')) return 'neon'
  return 'unknown'
}

async function testBlobWrite(): Promise<{ ok: boolean; message?: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (!token) return { ok: false, message: 'BLOB_READ_WRITE_TOKEN not set' }

  try {
    const { put } = await import('@vercel/blob')
    const result = await put(`cms-health-${Date.now()}.txt`, 'ok', {
      access: 'public',
      token,
      addRandomSuffix: true,
    })
    return { ok: true, message: result.url }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

/** Runtime diagnostics for argroup-education-cms (DB + required env). */
export async function GET(req: Request) {
  const testBlob = new URL(req.url).searchParams.get('testBlob') === '1'
  const dbHost = databaseHost()
  const checks = {
    databaseUrl: envSet('DATABASE_URL'),
    databaseHost: dbHost,
    payloadSecret: envSet('PAYLOAD_SECRET'),
    serverUrl:
      process.env.NEXT_PUBLIC_SERVER_URL?.trim() ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : ''),
    blobToken: envSet('BLOB_READ_WRITE_TOKEN'),
    vercel: process.env.VERCEL === '1',
    blobClientUploads:
      process.env.VERCEL === '1' && process.env.BLOB_CLIENT_UPLOADS !== 'false',
  }

  const missing = ['DATABASE_URL', 'PAYLOAD_SECRET'].filter((name) => !envSet(name))
  if (missing.length) {
    return NextResponse.json(
      {
        ok: false,
        service: 'argroup-education-cms',
        checks,
        message: `Missing Vercel env on argroup-education-cms: ${missing.join(', ')}`,
      },
      { status: 503 },
    )
  }

  try {
    const { Client } = await import('pg')
    const pool = resolveDatabasePoolConfig()
    const client = new Client(pool)
    await client.connect()
    await client.query('SELECT 1')
    const cmsTables = await client.query(
      `SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema = 'cms'`,
    )
    await client.end()

    const blob =
      testBlob && checks.blobToken ? await testBlobWrite() : undefined

    return NextResponse.json({
      ok: true,
      service: 'argroup-education-cms',
      checks: { ...checks, cmsTables: cmsTables.rows[0]?.n ?? 0 },
      ...(blob ? { blob } : {}),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    let hint = message
    if (/data transfer quota|exceeded.*quota/i.test(message)) {
      hint =
        dbHost === 'neon'
          ? 'Vercel still uses Neon — replace DATABASE_URL with your Supabase transaction pooler URL (port 6543), then redeploy.'
          : 'Database quota exceeded. Check your Postgres provider plan.'
    } else if (/password authentication failed/i.test(message)) {
      hint =
        'DATABASE_URL password wrong. Copy a fresh connection string from Supabase → Connect → Transaction pooler.'
    } else if (/does not exist|ENOTFOUND|getaddrinfo/i.test(message)) {
      hint =
        'DATABASE_URL host invalid. Use Supabase transaction pooler (pooler.supabase.com:6543) or Neon pooled URL.'
    } else if (/SELF_SIGNED_CERT/i.test(message)) {
      hint = 'SSL error — use Supabase pooler URL without sslmode in the string (handled in app config).'
    }
    return NextResponse.json(
      { ok: false, service: 'argroup-education-cms', checks, message, hint },
      { status: 503 },
    )
  }
}
