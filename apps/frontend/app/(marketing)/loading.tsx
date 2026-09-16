/** Shared instant shell while RSC for a route resolves. */
export default function MarketingLoading() {
  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-slate-50 via-white to-white" aria-busy="true">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-16">
        <div className="h-4 w-36 animate-pulse rounded bg-slate-200/80" />
        <div className="mt-6 h-10 max-w-2xl animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-4 h-4 max-w-xl animate-pulse rounded bg-slate-200/70" />
        <div className="mt-3 h-4 max-w-lg animate-pulse rounded bg-slate-200/50" />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <div className="mt-8 space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-10/12 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
