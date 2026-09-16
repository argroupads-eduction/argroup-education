export type FetchWithRetryOptions = {
  attempts?: number;
  delayMs?: number;
  backoffFactor?: number;
  shouldRetry?: (response: Response) => boolean;
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * fetch with retries on network errors and optional transient HTTP statuses.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const attempts = options.attempts ?? 3;
  const delayMs = options.delayMs ?? 500;
  const backoffFactor = options.backoffFactor ?? 1.5;
  let delay = delayMs;

  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(input, init);
      const retry =
        i < attempts - 1 && (options.shouldRetry?.(res) ?? false);
      if (!retry) return res;
      await res.text().catch(() => undefined);
    } catch (e) {
      if (i === attempts - 1) throw e;
    }
    await sleep(delay);
    delay = Math.round(delay * backoffFactor);
  }

  throw new Error('fetchWithRetry: exhausted attempts');
}
