/**
 * Lightweight in-memory rate limit for Edge middleware.
 * On multi-instance deploys (K8s/Vercel), pair with Redis or ingress rate limits — see docs/PRODUCTION-SCALING.md.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

/** Prevent unbounded Map growth in long-running Node processes. */
export function pruneRateLimitBuckets(maxSize = 10_000): void {
  if (buckets.size <= maxSize) return;
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (now >= v.resetAt) buckets.delete(k);
    if (buckets.size <= maxSize * 0.8) break;
  }
}
