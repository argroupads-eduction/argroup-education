import { after } from 'next/server'

/**
 * Run work after the admin Publish HTTP response is sent.
 * On Vercel, plain `void promise` is often frozen when the isolate ends —
 * `after()` keeps the invocation alive via waitUntil.
 */
export function deferAfterResponse(task: () => Promise<void>): void {
  const run = () =>
    task().catch((err) => {
      console.error('[deferAfterResponse] background task failed', err)
    })

  try {
    after(run)
  } catch {
    // Scripts / non-Next contexts: best-effort fire-and-forget.
    void run()
  }
}
