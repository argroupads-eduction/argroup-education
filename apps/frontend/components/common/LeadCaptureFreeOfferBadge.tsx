'use client';

import clsx from 'clsx';
import { PROMO_COUNSELLING_BADGE } from '@/lib/brandCopy';

export type LeadCaptureFreeOfferBadgeProps = {
  compact?: boolean;
  className?: string;
};

/**
 * Mint pill: ₹999 (struck through) + value badge — for promo/form areas, not the submit CTA.
 */
export function LeadCaptureFreeOfferBadge({
  compact = false,
  className,
}: LeadCaptureFreeOfferBadgeProps) {
  return (
    <div
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200/90 bg-[#e8f8f0] px-3 py-1.5 shadow-sm ring-1 ring-emerald-100/80',
        compact && 'gap-1.5 px-2.5 py-1',
        className
      )}
      role="status"
      aria-label="Counselling offer: nine hundred ninety-nine rupee value session included"
    >
      <span
        className={clsx(
          'font-semibold text-red-600 line-through decoration-red-500 decoration-2',
          compact ? 'text-[11px]' : 'text-sm'
        )}
      >
        ₹999
      </span>
      <span
        className={clsx(
          'font-extrabold tracking-tight text-emerald-700',
          compact ? 'text-xs' : 'text-sm'
        )}
      >
        {PROMO_COUNSELLING_BADGE}
      </span>
    </div>
  );
}
