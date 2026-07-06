/** Delay before rank popup on each page load / navigation (default: instant). */
export const RANK_PREDICTOR_POPUP_DELAY_MS =
  process.env.NEXT_PUBLIC_RANK_POPUP_DELAY_MS !== undefined
    ? Number(process.env.NEXT_PUBLIC_RANK_POPUP_DELAY_MS)
    : 0;

/** Pages where the rank popup should not appear. */
export function isRankPopupExcludedPath(pathname: string): boolean {
  return pathname.startsWith('/neet-rank-predictor');
}
