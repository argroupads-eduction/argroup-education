import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Test Payload boot + a real find — surfaces the REST 500 root cause. */
export async function GET() {
  const started = Date.now()
  try {
    const { getPayload } = await import('payload')
    const { default: config } = await import('@payload-config')
    const payload = await getPayload({ config })
    const bootMs = Date.now() - started

    const findStarted = Date.now()
    const posts = await payload.find({
      collection: 'posts',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const findMs = Date.now() - findStarted

    return NextResponse.json({
      ok: true,
      service: 'argroup-education-cms',
      payload: true,
      bootMs,
      findMs,
      postsTotal: posts.totalDocs,
      collections: Object.keys(payload.collections),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack?.split('\n').slice(0, 12).join('\n') : undefined
    return NextResponse.json(
      {
        ok: false,
        service: 'argroup-education-cms',
        elapsedMs: Date.now() - started,
        message,
        stack,
      },
      { status: 503 },
    )
  }
}
