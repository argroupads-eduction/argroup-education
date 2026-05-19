import clsx from 'clsx';

const inputClass =
  'w-full rounded-lg border border-white/40 bg-white/95 px-3 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 shadow-sm';

type HeroFormSkeletonProps = {
  title: string;
  panelClass: string;
  hint?: string;
  /** Shown in a collapsed block (dev / support only). */
  details?: string | null;
};

/** Placeholder fields while CMS definition loads (submit disabled). */
export function HeroFormSkeleton({ title, panelClass, hint, details }: HeroFormSkeletonProps) {
  return (
    <div className={panelClass}>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-8 w-1 shrink-0 rounded-full bg-gold-400" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/95">{title}</p>
      </div>
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
        aria-busy="true"
        aria-label="Loading enquiry form"
      >
        {['Full name', 'Phone', 'Email'].map((label) => (
          <div key={label} className={label === 'Email' ? 'sm:col-span-2' : undefined}>
            <label className="mb-1 block text-xs font-medium text-white">{label}</label>
            <input type="text" disabled className={clsx(inputClass, 'opacity-70')} placeholder="…" />
          </div>
        ))}
        {hint && (
          <p className="sm:col-span-2 text-center text-xs text-white/75" role="status">
            {hint}
          </p>
        )}
        {details && (
          <details className="sm:col-span-2 text-xs text-white/45">
            <summary className="cursor-pointer text-center hover:text-white/65">Technical details</summary>
            <p className="mt-2 break-words rounded border border-white/10 bg-black/20 px-2 py-1.5 text-left font-mono text-[10px] leading-relaxed">
              {details}
            </p>
          </details>
        )}
        <div className="sm:col-span-2">
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-lg bg-gold-500/50 px-4 py-2.5 text-sm font-semibold text-navy-900/70"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
