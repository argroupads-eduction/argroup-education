'use client'

import { useId, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

type FooterAccordionProps = {
  title: string
  href: string
  children?: ReactNode
  nested?: boolean
}

export function FooterAccordion({ title, href, children, nested }: FooterAccordionProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const hasPanel = Boolean(children)

  return (
    <div
      className={[
        'overflow-hidden rounded-md border bg-navy-800/50',
        nested ? 'border-navy-600' : 'border-gold-500/25',
      ].join(' ')}
    >
      <div className="flex items-stretch">
        <Link
          href={href}
          className={[
            'min-w-0 flex-1 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:text-gold-400',
            nested ? 'py-2 text-[13px]' : '',
          ].join(' ')}
        >
          <span className="line-clamp-2">{title}</span>
        </Link>
        {hasPanel ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            className="flex shrink-0 items-center justify-center border-l border-gold-500/20 px-2.5 text-gold-400 transition-colors hover:bg-navy-700/80 hover:text-gold-300"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
        ) : null}
      </div>
      {hasPanel && open ? (
        <div id={panelId} className="max-h-48 overflow-y-auto border-t border-gold-500/15 bg-navy-950/40 px-3 py-2">
          {children}
        </div>
      ) : null}
    </div>
  )
}
