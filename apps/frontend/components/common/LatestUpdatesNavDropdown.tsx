'use client';

import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { LATEST_UPDATES_NAV_ITEMS } from '@/lib/latestUpdatesNav';

type LatestUpdatesNavDropdownProps = {
  onCloseMega?: () => void;
  onNavigate?: () => void;
};

export function LatestUpdatesNavDropdown({
  onCloseMega,
  onNavigate,
}: LatestUpdatesNavDropdownProps) {
  return (
    <div className="relative group/latest-updates">
      <button
        type="button"
        className="nav-latest-updates-trigger"
        aria-haspopup="true"
        aria-expanded={false}
        onMouseEnter={onCloseMega}
      >
        Latest Updates
        <ChevronDown className="nav-latest-updates-chevron" aria-hidden />
      </button>

      <div className="nav-latest-updates-panel" role="menu">
        {LATEST_UPDATES_NAV_ITEMS.map((item) =>
          item.children?.length ? (
            <div key={item.label} className="relative group/nav-neet-flyout">
              <Link
                href={item.href}
                role="menuitem"
                className="nav-latest-updates-item nav-latest-updates-item--parent"
                onClick={onNavigate}
              >
                <span>{item.label}</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              </Link>
              <div className="nav-latest-updates-flyout" role="menu">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    role="menuitem"
                    className="nav-latest-updates-flyout-item"
                    onClick={onNavigate}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className={`nav-latest-updates-item${
                item.href === '/blog' ? ' nav-latest-updates-item--featured' : ''
              }`}
              onClick={onNavigate}
            >
              {item.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}
