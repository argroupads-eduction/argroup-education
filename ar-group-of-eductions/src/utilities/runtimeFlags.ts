/** True while `next build` is collecting page data (Vercel deploy). */
export function isNextProductionBuild(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build'
}
