import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
/** Vercel Hobby max is 60s; Pro can go higher — keep under limit. */
export const maxDuration = 60

/**
 * Run Payload jobs (including schedulePublish).
 * - Vercel Cron (Hobby): once daily via vercel.json — not enough for minute-level schedules.
 * - Prefer GitHub Action `.github/workflows/cms-scheduled-jobs.yml` every 10m with
 *   secrets CMS_CRON_URL + CMS_CRON_SECRET (same value as Vercel CRON_SECRET).
 * - Local: jobs.autoRun in payload.config.ts runs every minute instead.
 */
function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const started = Date.now()
  try {
    const { getPayload } = await import('payload')
    const { default: config } = await import('@payload-config')
    const payload = await getPayload({ config })

    // Built-in /api/payload-jobs/run also handles schedules when configured;
    // schedulePublish jobs are queued with waitUntil — run() picks due ones.
    const result = await payload.jobs.run({
      limit: 20,
      queue: 'default',
      overrideAccess: true,
    })

    return NextResponse.json({
      ok: true,
      elapsedMs: Date.now() - started,
      noJobsRemaining: result?.noJobsRemaining ?? null,
      remainingJobsFromQueried: result?.remainingJobsFromQueried ?? null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { ok: false, error: message, elapsedMs: Date.now() - started },
      { status: 500 },
    )
  }
}
