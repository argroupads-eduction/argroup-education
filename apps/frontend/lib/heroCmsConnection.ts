/** True when the CMS was unreachable or still starting (retry may succeed). */
export function isTransientHeroCmsError(message: string): boolean {
  return /cannot reach (cms|payload|form api)|empty response from (cms|form api|payload)|econnrefused|fetch failed|network error|timed out|timeout|aborted|prefetch skipped/i.test(
    message
  );
}
