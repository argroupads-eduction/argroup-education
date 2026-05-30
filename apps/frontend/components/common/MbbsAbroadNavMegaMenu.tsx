'use client'

import { MbbsAbroadCollegesPanel } from '@/components/mbbs-abroad/MbbsAbroadCollegesPanel'

type MbbsAbroadNavMegaMenuProps = {
  onNavigate?: () => void
}

export function MbbsAbroadNavMegaMenu({ onNavigate }: MbbsAbroadNavMegaMenuProps) {
  return (
    <MbbsAbroadCollegesPanel onNavigate={onNavigate} layout="nav" />
  )
}
