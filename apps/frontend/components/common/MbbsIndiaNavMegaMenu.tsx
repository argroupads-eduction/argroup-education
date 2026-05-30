'use client'

import Link from 'next/link'
import { MbbsIndiaCollegesPanel } from '@/components/mbbs-india/MbbsIndiaCollegesPanel'

type MbbsIndiaNavMegaMenuProps = {
  onNavigate?: () => void
}

export function MbbsIndiaNavMegaMenu({ onNavigate }: MbbsIndiaNavMegaMenuProps) {
  return (
    <div className="relative">
      <MbbsIndiaCollegesPanel onNavigate={onNavigate} layout="nav" />
      <div className="mt-2 flex justify-end px-1">
        <Link
          href="/mbbs-india"
          onClick={onNavigate}
          className="text-[11px] font-semibold text-gold-700 hover:underline"
        >
          View all states →
        </Link>
      </div>
    </div>
  )
}
