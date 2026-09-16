'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import Link from 'next/link'
import { SearchIcon } from 'lucide-react'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const menuItems = data?.menuItems || []

  return (
    <nav className="flex gap-3 items-center">
      {menuItems.map((item, i) => {
        const href =
          item.linkType === 'custom' && item.url
            ? item.url
            : typeof item.page === 'object' && item.page?.slug
              ? `/${item.page.slug}`
              : '#'
        return (
          <Link key={item.id ?? i} href={href}>
            {item.label}
          </Link>
        )
      })}
      <Link href="/search">
        <span className="sr-only">Search</span>
        <SearchIcon className="w-5 text-primary" />
      </Link>
    </nav>
  )
}
