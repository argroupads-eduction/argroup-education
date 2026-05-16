/** True when the CMS was unreachable or still starting (retry may succeed). */
export function isTransientHeroCmsError(message: string): boolean {
  return /cannot reach (cms|payload)|empty response from (cms|form api)|econnrefused|fetch failed|network error/i.test(
    message
  );
}
