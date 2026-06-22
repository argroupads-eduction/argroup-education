import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function envSet(name: string): boolean {
  return Boolean(process.env[name]?.trim())
}

/** Runtime diagnostics for argroup-education-cms (DB + required env). */
export async function GET() {
  const checks = {
    databaseUrl: envSet('DATABASE_URL'),
    payloadSecret: envSet('PAYLOAD_SECRET'),
    serverUrl:
      process.env.NEXT_PUBLIC_SERVER_URL?.trim() ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : ''),
    blobToken: envSet('BLOB_READ_WRITE_TOKEN'),
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
    const client = new Client({ connectionString: process.env.DATABASE_URL!.trim() })
    await client.connect()
    await client.query('SELECT 1')
    await client.end()
    return NextResponse.json({ ok: true, service: 'argroup-education-cms', checks })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    let hint = message
    if (/data transfer quota|exceeded.*quota/i.test(message)) {
      hint =
        'Neon data-transfer quota exceeded. Upgrade at console.neon.tech — CMS needs DB access at runtime.'
    } else if (/password authentication failed/i.test(message)) {
      hint = 'DATABASE_URL password wrong. Copy a fresh pooled URL from Neon (database: payloadcms_db).'
    } else if (/does not exist|ENOTFOUND|getaddrinfo/i.test(message)) {
      hint = 'DATABASE_URL host invalid. Use Neon pooled URL with -pooler in the hostname.'
    }
    return NextResponse.json(
      { ok: false, service: 'argroup-education-cms', checks, message, hint },
      { status: 503 },
    )
  }
}
