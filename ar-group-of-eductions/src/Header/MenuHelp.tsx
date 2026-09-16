'use client'

import type React from 'react'

export const MenuHelp: React.FC = () => {
  return (
    <div
      style={{
        marginBottom: '1rem',
        padding: '12px 14px',
        borderRadius: 8,
        background: 'var(--theme-elevation-100)',
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <strong>How this matches your live site menu</strong>
      <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
        <li>
          <strong>Level 1:</strong> Home, About, MBBS India, MBBS Abroad, MD/MS, Blog, Contact
        </li>
        <li>
          <strong>Level 2:</strong> e.g. MBBS in UP (under MBBS India)
        </li>
        <li>
          <strong>Level 3:</strong> colleges under each state (Rama Medical College, …)
        </li>
        <li>
          Run <code>npm run seed:main-menu</code> once to load the full tree from your export files.
        </li>
        <li>
          Use <strong>Quick add — recent pages</strong> for pages you just created (most recent first).
        </li>
      </ul>
    </div>
  )
}
