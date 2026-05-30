'use client'

import Link from 'next/link'
import { MbbsAbroadCollegesPanel } from '@/components/mbbs-abroad/MbbsAbroadCollegesPanel'

type MbbsAbroadNavMegaMenuProps = {
  onNavigate?: () => void
}

export function MbbsAbroadNavMegaMenu({ onNavigate }: MbbsAbroadNavMegaMenuProps) {
  return (
    <div className="relative">
      <MbbsAbroadCollegesPanel onNavigate={onNavigate} layout="nav" />
      <div className="mt-2 flex justify-end px-1">
        <Link
          href="/mbbs-abroad"
          onClick={onNavigate}
          className="text-[11px] font-semibold text-gold-700 hover:underline"
        >
          View all countries →
        </Link>
      </div>
    </div>
  )
}
