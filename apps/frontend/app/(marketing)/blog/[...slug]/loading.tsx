export default function BlogPostLoading() {
  return (
    <div className="blog-root blog-post-root" aria-busy="true" aria-live="polite">
      <header className="blog-post-hero">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
          <div className="mb-6 h-4 w-40 animate-pulse rounded bg-white/20" />
          <div className="h-10 max-w-3xl animate-pulse rounded-lg bg-white/25" />
          <div className="mt-4 h-4 max-w-xl animate-pulse rounded bg-white/15" />
          <div className="mt-3 h-4 max-w-lg animate-pulse rounded bg-white/10" />
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[minmax(0,1fr)_16rem] md:py-14">
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-xl bg-slate-200/80" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-200/70" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200/60" />
          <div className="h-4 w-10/12 animate-pulse rounded bg-slate-200/50" />
          <div className="h-4 w-9/12 animate-pulse rounded bg-slate-200/40" />
        </div>
        <div className="hidden space-y-3 md:block">
          <div className="h-6 w-32 animate-pulse rounded bg-slate-200/70" />
          <div className="h-16 animate-pulse rounded-lg bg-slate-200/50" />
          <div className="h-16 animate-pulse rounded-lg bg-slate-200/50" />
          <div className="h-16 animate-pulse rounded-lg bg-slate-200/50" />
        </div>
      </div>
    </div>
  );
}
