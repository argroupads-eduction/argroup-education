'use client'

import { MbbsIndiaCollegesPanel } from '@/components/mbbs-india/MbbsIndiaCollegesPanel'

type MbbsIndiaNavMegaMenuProps = {
  onNavigate?: () => void
}

export function MbbsIndiaNavMegaMenu({ onNavigate }: MbbsIndiaNavMegaMenuProps) {
  return (
    <MbbsIndiaCollegesPanel onNavigate={onNavigate} layout="nav" />
  )
}
