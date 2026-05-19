/** True when the CMS was unreachable or still starting (retry may succeed). */
export function isTransientHeroCmsError(message: string): boolean {
  return /cannot reach (cms|payload|form api)|empty response from (cms|form api|payload)|econnrefused|fetch failed|network error|timed out|timeout|aborted|prefetch skipped|cms is still starting/i.test(
    message
  );
}

/** True when Payload is unreachable or misconfigured — use static hero form fields. */
export function shouldUseHeroMbbsFallback(message: string, pollAttempts: number): boolean {
  if (pollAttempts >= 3) return true;
  if (/wrong service|not payload|payload returned|no form (named|titled|matched)|port \d+ is not/i.test(message)) {
    return true;
  }
  return !isTransientHeroCmsError(message);
}
