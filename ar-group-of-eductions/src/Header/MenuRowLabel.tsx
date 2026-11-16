'use client'

import type React from 'react'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type Row = {
  label?: string | null
  url?: string | null
  linkType?: string | null
}

export const MenuRowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<Row>()
  const label = data?.data?.label?.trim()
  const url = data?.data?.url?.trim()
  const suffix = url ? ` → ${url}` : data?.data?.linkType === 'page' ? ' → (page)' : ''
  return <span>{label || `Menu item ${String(data.rowNumber ?? '')}`}{suffix}</span>
}
