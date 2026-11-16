/** Instant shell for legacy WP/content catch-all pages (colleges, guides, …). */
export default function SlugLoading() {
  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-navy-50/40 via-white to-white" aria-busy="true">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="h-4 w-44 animate-pulse rounded bg-slate-200/80" />
        <div className="mt-6 h-12 max-w-3xl animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-4">
            <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-10/12 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-9/12 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="hidden space-y-3 lg:block">
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
