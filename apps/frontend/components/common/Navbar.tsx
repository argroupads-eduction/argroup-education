'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Menu,
  X,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Youtube,
  MessageCircle,
  ChevronDown,
} from 'lucide-react';
import { CTA_EXPERT_COUNSELLING } from '@/lib/brandCopy';
import { CONTACT_INFO, FOOTER_SOCIAL_PLATFORMS, NAV_LINKS, SOCIAL_LINKS } from '@/lib/constants';
import { openLeadCapturePopup } from '@/lib/openLeadCapture';
import { MbbsIndiaNavMegaMenu } from '@/components/common/MbbsIndiaNavMegaMenu';
import { MbbsAbroadNavMegaMenu } from '@/components/common/MbbsAbroadNavMegaMenu';
import { MdMsNavMegaMenu } from '@/components/common/MdMsNavMegaMenu';
import { LatestUpdatesNavDropdown } from '@/components/common/LatestUpdatesNavDropdown';
import { LATEST_UPDATES_NAV_ITEMS } from '@/lib/latestUpdatesNav';
import { useDynamicNavPages } from '@/components/common/NavPagesProvider';
import { navPagesForSection } from '@/lib/dynamicNav';
import { BrandLogoLink } from '@/components/common/BrandLogoLink';
import { Button } from '@/components/ui/Button';
import { useBodyScrollLock, useMegaMenu, useScrollPosition, type MegaMenuId } from '@/hooks';

/** Navbar LIVE CTA — College Predictor only (inlined to avoid stale Rank Predictor HMR). */
function NavCollegePredictorCta({ onClick }: { onClick?: () => void }) {
  return (
    <div className="nav-neet-cta-wrap" suppressHydrationWarning>
      <span className="nav-live-pill" aria-hidden>
        <span className="nav-live-pill__ping" />
        <span className="nav-live-pill__dot" />
        LIVE
      </span>
      <Link
        href="/college-predictor"
        onClick={onClick}
        className="nav-neet-cta-btn"
        suppressHydrationWarning
        prefetch={false}
      >
        College Predictor
        <span className="nav-neet-cta-btn__badge">NEW</span>
      </Link>
    </div>
  );
}

type NavBarLink = {
  label: string;
  href: string;
  megaMenu?: MegaMenuId;
  navMenu?: string;
  submenu?: ReadonlyArray<{ href: string; label: string } & Record<string, unknown>>;
};

export const Navbar = () => {
  const dynamicPages = useDynamicNavPages();
  const navLinks = useMemo((): NavBarLink[] => {
    const extras = navPagesForSection(dynamicPages, 'main').map((p) => ({
      label: p.label,
      href: p.href,
    }));
    if (!extras.length) return [...NAV_LINKS];
    const links: NavBarLink[] = [...NAV_LINKS];
    const contactIndex = links.findIndex((l) => l.href === '/contact');
    const insertAt = contactIndex >= 0 ? contactIndex : links.length;
    links.splice(insertAt, 0, ...extras);
    return links;
  }, [dynamicPages]);

  const [isOpen, setIsOpen] = useState(false);
  useBodyScrollLock(isOpen);
  const { megaOpen, openMega, cancelClose, scheduleClose, forceClose, rootRef } = useMegaMenu();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [openMobileState, setOpenMobileState] = useState<string | null>(null);
  const [openMobileUniversity, setOpenMobileUniversity] = useState<string | null>(null);
  const [openMobileLatestNeet, setOpenMobileLatestNeet] = useState(false);
  const scrollPosition = useScrollPosition();
  const isScrolled = scrollPosition > 50;

  useEffect(() => {
    if (!isOpen) {
      setOpenSubmenu(null);
      setOpenMobileState(null);
      setOpenMobileUniversity(null);
      setOpenMobileLatestNeet(false);
    }
  }, [isOpen]);

  const closeMobileNav = () => {
    setIsOpen(false);
    setOpenSubmenu(null);
    setOpenMobileState(null);
    setOpenMobileUniversity(null);
    setOpenMobileLatestNeet(false);
    forceClose();
  };

  const toggleMobileNav = () => {
    setIsOpen((open) => {
      const next = !open;
      if (next) forceClose();
      return next;
    });
  };

  const megaGroupClass = (megaMenu?: string) => {
    if (megaMenu === 'mbbs-india') return 'relative group/mbbs-india';
    if (megaMenu === 'mbbs-abroad') return 'relative group/mbbs-abroad';
    if (megaMenu === 'md-ms') return 'relative group/md-ms';
    return 'relative group';
  };

  const megaHoverUnderline = (megaMenu?: string) => {
    if (megaMenu === 'mbbs-india') return 'group-hover/mbbs-india:w-full';
    if (megaMenu === 'mbbs-abroad') return 'group-hover/mbbs-abroad:w-full';
    if (megaMenu === 'md-ms') return 'group-hover/md-ms:w-full';
    return 'group-hover:w-full';
  };

  const handleMegaEnter = (id: MegaMenuId) => {
    cancelClose();
    openMega(id);
  };

  const megaInnerWidth =
    megaOpen === 'mbbs-abroad' ? 'max-w-[72rem]' : megaOpen === 'md-ms' ? 'max-w-3xl' : 'max-w-6xl';

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${
          isScrolled ? 'shadow-md' : ''
        }`}
      >
      {/* Top Bar — sticky with main nav; phone CTA high-contrast */}
      <div className="site-topbar hidden xl:block">
        <div className="site-topbar-inner mx-auto max-w-[84rem] px-4 xl:px-6">
          <div className="site-topbar-contacts">
            <a
              href={`tel:${CONTACT_INFO.phoneTel}`}
              className="site-topbar-contact site-topbar-contact--phone"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {CONTACT_INFO.phone}
            </a>
            <a
              href={`mailto:${CONTACT_INFO.email}`}
              className="site-topbar-contact site-topbar-contact--email"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden />
              {CONTACT_INFO.email}
            </a>
          </div>
          <div className="site-topbar-social">
            {SOCIAL_LINKS.filter((social) =>
              FOOTER_SOCIAL_PLATFORMS.includes(
                social.platform as (typeof FOOTER_SOCIAL_PLATFORMS)[number]
              )
            ).map((social) => {
              const Icon =
                social.platform === 'facebook'
                  ? Facebook
                  : social.platform === 'instagram'
                    ? Instagram
                    : social.platform === 'youtube'
                      ? Youtube
                      : null;
              if (!Icon) return null;
              return (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`site-topbar-social-link site-topbar-social-link--${social.platform}`}
                  aria-label={social.platform}
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={`border-b bg-white transition-colors duration-200 ${
          isScrolled ? 'border-gray-200' : 'border-gray-100'
        }`}
      >
        <div ref={rootRef} className="nav-mega-root relative">
          {megaOpen ? <div className="nav-mega-bridge" aria-hidden /> : null}
          <div className="site-navbar-inner relative mx-auto max-w-[84rem] overflow-visible px-4 xl:px-6">
            {/* Logo, contained inside navbar height */}
            <div className="site-navbar-logo" onMouseEnter={forceClose}>
              <BrandLogoLink frameClassName="brand-logo-link__frame--nav-wide">
                <Image
                  src="/ar-group-logo.webp"
                  alt="AR Group of Education — MBBS India and abroad counselling"
                  width={140}
                  height={56}
                  sizes="140px"
                  priority
                  className="brand-logo-link__img"
                />
              </BrandLogoLink>
            </div>

            {/* Desktop Menu, xl+ only; tablet uses hamburger menu */}
            <div className="site-navbar-nav relative z-[80] hidden xl:flex">
              <div className="site-navbar-nav-list">
              {navLinks.map((link: NavBarLink) => (
                <div key={link.href} className={megaGroupClass(link.megaMenu)}>
                  {link.navMenu === 'latest-updates' ? (
                    <LatestUpdatesNavDropdown onCloseMega={forceClose} onNavigate={forceClose} />
                  ) : link.submenu ? (
                    link.megaMenu ? (
                      <Link
                        href={link.href}
                        id={`nav-mega-trigger-${link.megaMenu}`}
                        aria-expanded={megaOpen === link.megaMenu}
                        aria-haspopup="true"
                        aria-controls={`nav-mega-panel-${link.megaMenu}`}
                        onMouseEnter={() => handleMegaEnter(link.megaMenu as MegaMenuId)}
                        onFocus={() => handleMegaEnter(link.megaMenu as MegaMenuId)}
                        onClick={forceClose}
                        className={[
                          'nav-mega-trigger',
                          link.megaMenu === 'mbbs-india' ? 'nav-mega-trigger--india' : '',
                          link.megaMenu === 'mbbs-abroad' ? 'nav-mega-trigger--abroad' : '',
                          link.megaMenu === 'md-ms' ? 'nav-mega-trigger--mdms' : '',
                          megaOpen === link.megaMenu ? 'nav-mega-trigger--active' : '',
                        ].join(' ')}
                      >
                        {link.label}
                        <ChevronDown
                          className={[
                            'nav-mega-chevron',
                            megaOpen === link.megaMenu ? 'nav-mega-chevron--open' : '',
                          ].join(' ')}
                          aria-hidden
                        />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="text-navy-900 font-body font-medium text-sm hover:text-gold-600 transition-colors duration-200 px-3 py-2 relative flex items-center gap-1"
                      >
                        {link.label}
                        <ChevronDown className="w-4 h-4" />
                        <span
                          className={`absolute bottom-0 left-0 w-0 h-0.5 bg-gold-600 transition-all duration-200 ${megaHoverUnderline(link.megaMenu)}`}
                        />
                      </button>
                    )
                  ) : (
                    <Link
                      href={link.href}
                      onMouseEnter={forceClose}
                      onClick={forceClose}
                      className="site-nav-plain-link"
                    >
                      {link.label}
                    </Link>
                  )}

                  {link.submenu && !link.megaMenu && link.navMenu !== 'latest-updates' ? (
                    <div className="absolute left-0 mt-0 w-48 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-2 z-50">
                      {link.submenu.map((item: { href: string; label: string }) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-2 text-sm font-body text-navy-900 hover:bg-gold-50 hover:text-gold-600 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              </div>
            </div>

            {/* CTA, aligned on one line, right of nav */}
            <div className="site-navbar-cta hidden xl:flex" onMouseEnter={forceClose}>
              <Button type="button" variant="primary" size="md" onClick={() => openLeadCapturePopup()}>
                {CTA_EXPERT_COUNSELLING}
              </Button>
              <NavCollegePredictorCta onClick={forceClose} />
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="ms-auto rounded-lg p-2 text-navy-900 transition-colors hover:bg-slate-100 active:bg-slate-200 xl:hidden"
              onClick={toggleMobileNav}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Desktop mega menus, full width, flush under navbar */}
          <div
            id={megaOpen ? `nav-mega-panel-${megaOpen}` : undefined}
            role="region"
            aria-labelledby={megaOpen ? `nav-mega-trigger-${megaOpen}` : undefined}
            className={[
              'nav-mega-layer absolute inset-x-0 top-full hidden xl:block',
              megaOpen ? 'nav-mega-layer--open' : '',
            ].join(' ')}
          >
            <div
              className={`nav-mega-layer-inner mx-auto w-full px-4 pb-2 pt-0 ${megaInnerWidth}`}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
            >
              {megaOpen === 'mbbs-india' ? (
                <MbbsIndiaNavMegaMenu onNavigate={forceClose} />
              ) : null}
              {megaOpen === 'mbbs-abroad' ? (
                <MbbsAbroadNavMegaMenu onNavigate={forceClose} />
              ) : null}
              {megaOpen === 'md-ms' ? <MdMsNavMegaMenu onNavigate={forceClose} /> : null}
            </div>
          </div>
        </div>

        {/* Mobile Menu, keep mounted; hide with CSS for smoother open/close */}
        <div
          className={[
            'xl:hidden overflow-hidden border-t border-gray-200 bg-white transition-[max-height,opacity] duration-200 ease-out',
            isOpen ? 'max-h-[min(85vh,900px)] opacity-100' : 'max-h-0 opacity-0 pointer-events-none border-t-transparent',
          ].join(' ')}
          aria-hidden={!isOpen}
        >
            <div className="max-h-[min(85vh,900px)] overflow-y-auto overscroll-contain px-4 py-4 space-y-2">
              {navLinks.map((link: NavBarLink) => (
                <div key={link.href}>
                  {link.submenu ? (
                    <>
                      <div className="flex items-center gap-1">
                        <Link
                          href={link.href}
                          onClick={closeMobileNav}
                          className={[
                            'flex-1 rounded-lg px-2 py-2 font-body font-semibold hover:bg-gold-50 hover:text-gold-700',
                            link.navMenu === 'latest-updates'
                              ? 'nav-latest-updates-mobile-trigger inline-flex items-center gap-2 text-amber-800'
                              : 'text-navy-900',
                          ].join(' ')}
                        >
                          {link.label}
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            const next = openSubmenu === link.href ? null : link.href;
                            setOpenSubmenu(next);
                            if (!next) {
                              setOpenMobileState(null);
                              setOpenMobileUniversity(null);
                              setOpenMobileLatestNeet(false);
                            }
                          }}
                          className="rounded-lg p-2 text-navy-900 hover:bg-gold-50"
                          aria-expanded={openSubmenu === link.href}
                          aria-label={`Show ${link.label} menu`}
                        >
                          <ChevronDown
                            className={`h-5 w-5 transition-transform duration-200 ${
                              openSubmenu === link.href ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={link.href}
                      className="block py-2 font-body font-medium text-navy-900 hover:text-gold-500"
                      onClick={closeMobileNav}
                    >
                      {link.label}
                    </Link>
                  )}

                  {link.submenu && openSubmenu === link.href && (
                    <div className="pl-2 py-2 max-h-[70vh] overflow-y-auto overscroll-contain [content-visibility:auto]">
                      {link.navMenu === 'latest-updates'
                        ? LATEST_UPDATES_NAV_ITEMS.map((item) =>
                            item.children?.length ? (
                              <div key={item.label} className="mb-1">
                                <button
                                  type="button"
                                  onClick={() => setOpenMobileLatestNeet((open) => !open)}
                                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-medium text-navy-900 hover:bg-gold-50"
                                >
                                  {item.label}
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${
                                      openMobileLatestNeet ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>
                                {openMobileLatestNeet ? (
                                  <div className="nav-latest-updates-mobile-nested pb-2">
                                    {item.children.map((child) => (
                                      <Link
                                        key={child.href}
                                        href={child.href}
                                        className="block py-1.5 text-xs text-navy-800 hover:text-gold-600"
                                        onClick={closeMobileNav}
                                      >
                                        {child.label}
                                      </Link>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={[
                                  'block py-1.5 text-sm font-body text-navy-800 hover:text-gold-600 pl-2',
                                  item.href === '/blog' ? 'nav-latest-updates-mobile-item--featured' : '',
                                ].join(' ')}
                                onClick={closeMobileNav}
                              >
                                {item.label}
                              </Link>
                            )
                          )
                        : link.megaMenu === 'mbbs-india'
                        ? link.submenu.map(
                            (item: {
                              href: string
                              label: string
                              stateName?: string
                              colleges?: { label: string; href: string }[]
                            }) => (
                              <div key={item.href} className="mb-1">
                                <div className="flex items-center gap-0.5 rounded-md hover:bg-gold-50">
                                  <Link
                                    href={item.href}
                                    className="min-w-0 flex-1 px-2 py-2 text-left text-sm font-medium text-navy-900"
                                    onClick={closeMobileNav}
                                  >
                                    MBBS in {item.stateName ?? item.label}
                                  </Link>
                                  {item.colleges?.length ? (
                                    <button
                                      type="button"
                                      aria-label={
                                        openMobileState === item.href
                                          ? 'Collapse colleges'
                                          : 'Expand colleges'
                                      }
                                      aria-expanded={openMobileState === item.href}
                                      onClick={() =>
                                        setOpenMobileState(
                                          openMobileState === item.href ? null : item.href
                                        )
                                      }
                                      className="shrink-0 rounded-md p-2 text-navy-900"
                                    >
                                      <ChevronDown
                                        className={`h-4 w-4 transition-transform ${
                                          openMobileState === item.href ? 'rotate-180' : ''
                                        }`}
                                      />
                                    </button>
                                  ) : null}
                                </div>
                                {openMobileState === item.href && item.colleges ? (
                                  <div className="ml-2 border-l border-slate-200 pl-3 pb-2">
                                    {item.colleges.map((college) => (
                                      <Link
                                        key={college.href + college.label}
                                        href={college.href}
                                        className="block py-1.5 text-xs text-navy-800 hover:text-gold-600"
                                        onClick={closeMobileNav}
                                      >
                                        {college.label}
                                      </Link>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            )
                          )
                        : link.megaMenu === 'mbbs-abroad'
                          ? link.submenu.map(
                              (item: {
                                href: string
                                label: string
                                countryName?: string
                                colleges?: { label: string; href: string }[]
                                universities?: {
                                  href: string
                                  label: string
                                  colleges?: { label: string; href: string }[]
                                }[]
                              }) => (
                                <div key={item.href} className="mb-1">
                                  <div className="flex items-center gap-0.5 rounded-md hover:bg-gold-50">
                                    <Link
                                      href={item.href}
                                      className="min-w-0 flex-1 px-2 py-2 text-left text-sm font-medium text-navy-900"
                                      onClick={closeMobileNav}
                                    >
                                      MBBS in {item.countryName ?? item.label}
                                    </Link>
                                    {item.universities?.length || item.colleges?.length ? (
                                      <button
                                        type="button"
                                        aria-label={
                                          openMobileState === item.href
                                            ? 'Collapse list'
                                            : 'Expand list'
                                        }
                                        aria-expanded={openMobileState === item.href}
                                        onClick={() => {
                                          const next =
                                            openMobileState === item.href ? null : item.href
                                          setOpenMobileState(next)
                                          setOpenMobileUniversity(null)
                                        }}
                                        className="shrink-0 rounded-md p-2 text-navy-900"
                                      >
                                        <ChevronDown
                                          className={`h-4 w-4 transition-transform ${
                                            openMobileState === item.href ? 'rotate-180' : ''
                                          }`}
                                        />
                                      </button>
                                    ) : null}
                                  </div>
                                  {openMobileState === item.href && item.universities ? (
                                    <div className="ml-2 border-l border-slate-200 pl-3 pb-2">
                                      {item.universities.map((university) => (
                                        <div key={university.href} className="mb-1">
                                          {university.colleges?.length ? (
                                            <>
                                              <div className="flex items-center gap-0.5 rounded-md hover:bg-gold-50">
                                                <Link
                                                  href={university.href}
                                                  className="min-w-0 flex-1 px-1 py-1.5 text-left text-xs font-medium text-navy-900"
                                                  onClick={closeMobileNav}
                                                >
                                                  {university.label}
                                                </Link>
                                                <button
                                                  type="button"
                                                  aria-label={
                                                    openMobileUniversity === university.href
                                                      ? 'Collapse colleges'
                                                      : 'Expand colleges'
                                                  }
                                                  aria-expanded={
                                                    openMobileUniversity === university.href
                                                  }
                                                  onClick={() =>
                                                    setOpenMobileUniversity(
                                                      openMobileUniversity === university.href
                                                        ? null
                                                        : university.href
                                                    )
                                                  }
                                                  className="shrink-0 rounded-md p-1.5 text-navy-900"
                                                >
                                                  <ChevronDown
                                                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                                                      openMobileUniversity === university.href
                                                        ? 'rotate-180'
                                                        : ''
                                                    }`}
                                                  />
                                                </button>
                                              </div>
                                              {openMobileUniversity === university.href ? (
                                                <div className="ml-2 border-l border-slate-100 pl-2">
                                                  {university.colleges.map((college) => (
                                                    <Link
                                                      key={college.href + college.label}
                                                      href={college.href}
                                                      className="block py-1 text-xs text-navy-800 hover:text-gold-600"
                                                      onClick={closeMobileNav}
                                                    >
                                                      {college.label}
                                                    </Link>
                                                  ))}
                                                </div>
                                              ) : null}
                                            </>
                                          ) : (
                                            <Link
                                              href={university.href}
                                              className="block py-1.5 text-xs text-navy-800 hover:text-gold-600"
                                              onClick={closeMobileNav}
                                            >
                                              {university.label}
                                            </Link>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}
                                  {openMobileState === item.href &&
                                  item.colleges &&
                                  !item.universities ? (
                                    <div className="ml-2 border-l border-slate-200 pl-3 pb-2">
                                      {item.colleges.map((college) => (
                                        <Link
                                          key={college.href + college.label}
                                          href={college.href}
                                          className="block py-1.5 text-xs text-navy-800 hover:text-gold-600"
                                          onClick={closeMobileNav}
                                        >
                                          {college.label}
                                        </Link>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              )
                            )
                          : link.submenu.map((item: { href: string; label: string }) => (
                        <Link
                          key={item.href}
                          href={item.href}
                                className="block text-sm font-body text-navy-800 hover:text-gold-600 py-1.5 pl-2"
                          onClick={closeMobileNav}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-4 flex flex-col items-center gap-3">
                <Button
                  type="button"
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    closeMobileNav();
                    openLeadCapturePopup();
                  }}
                >
                  {CTA_EXPERT_COUNSELLING}
                </Button>
                <NavCollegePredictorCta onClick={closeMobileNav} />
              </div>
            </div>
        </div>
      </nav>
      </header>

      {/* WhatsApp Floating Button */}
      <a
        href={CONTACT_INFO.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center z-40 hover:bg-green-600 hover:scale-105 active:scale-95 transition-transform duration-200"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </>
  );
};
