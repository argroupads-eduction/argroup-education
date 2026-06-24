import { NextResponse } from 'next/server'
import config from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Test Payload boot — surfaces the real init error when /admin returns 500. */
export async function GET() {
  try {
    const { getPayload } = await import('payload')
    const payload = await getPayload({ config })
    return NextResponse.json({
      ok: true,
      service: 'argroup-education-cms',
      payload: true,
      collections: Object.keys(payload.collections),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack?.split('\n').slice(0, 8).join('\n') : undefined
    return NextResponse.json(
      {
        ok: false,
        service: 'argroup-education-cms',
        message,
        stack,
      },
      { status: 503 },
    )
  }
}
