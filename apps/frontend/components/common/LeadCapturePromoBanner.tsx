'use client';

import clsx from 'clsx';

export type LeadCapturePromoBannerProps = {
  compact?: boolean;
  className?: string;
};

/**
 * Mint promo block: journey headline + expert counselling — left panel / mobile header.
 */
export function LeadCapturePromoBanner({
  compact = false,
  className,
}: LeadCapturePromoBannerProps) {
  return (
    <div
      className={clsx(
        'rounded-xl bg-emerald-50 px-4 py-3 text-center ring-1 ring-emerald-100/90',
        compact && 'rounded-lg px-3 py-2.5',
        className
      )}
      role="status"
      aria-label="Start your MBBS abroad journey today — get expert counselling"
    >
      <p
        className={clsx(
          'font-serif font-bold text-navy-900',
          compact ? 'text-[13px] leading-tight' : 'text-[15px] leading-snug md:text-base'
        )}
      >
        Start Your MBBS Abroad Journey Today!
      </p>
      <p
        className={clsx(
          'mt-1.5 font-medium text-navy-800',
          compact ? 'text-[11px] leading-snug' : 'text-sm leading-relaxed'
        )}
      >
        Get Expert Counselling
      </p>
    </div>
  );
}
