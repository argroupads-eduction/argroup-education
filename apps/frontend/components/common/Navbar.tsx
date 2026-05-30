'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Menu,
  X,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  ChevronDown,
} from 'lucide-react';
import { NAV_LINKS } from '@/lib/constants';
import { BrandLogoLink } from '@/components/common/BrandLogoLink';
import { Button } from '@/components/ui/Button';
import { useMegaMenu, useScrollPosition, type MegaMenuId } from '@/hooks';

const MbbsIndiaNavMegaMenu = dynamic(
  () =>
    import('@/components/common/MbbsIndiaNavMegaMenu').then((m) => ({
      default: m.MbbsIndiaNavMegaMenu,
    })),
  { loading: () => null }
);

const MbbsAbroadNavMegaMenu = dynamic(
  () =>
    import('@/components/common/MbbsAbroadNavMegaMenu').then((m) => ({
      default: m.MbbsAbroadNavMegaMenu,
    })),
  { loading: () => null }
);

const MdMsNavMegaMenu = dynamic(
  () =>
    import('@/components/common/MdMsNavMegaMenu').then((m) => ({
      default: m.MdMsNavMegaMenu,
    })),
  { loading: () => null }
);

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { megaOpen, openMega, closeMega, cancelClose, forceClose } = useMegaMenu();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [openMobileState, setOpenMobileState] = useState<string | null>(null);
  const [openMobileUniversity, setOpenMobileUniversity] = useState<string | null>(null);
  const scrollPosition = useScrollPosition();
  const isScrolled = scrollPosition > 50;

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
      {/* Top Bar */}
      <div
        className={`hidden md:block border-b transition-colors duration-200 ${
          isScrolled ? 'bg-white border-gray-200' : 'bg-navy-50 border-gray-100'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-2 flex justify-between items-center text-sm">
          <div className="flex gap-6">
            <a
              href="tel:+918001234567"
              className="flex items-center gap-2 text-gray-600 hover:text-gold-500 font-body font-medium"
            >
              <Phone className="w-4 h-4" />
              +91 (800) 123-4567
            </a>
            <a
              href="mailto:info@argroup.edu"
              className="flex items-center gap-2 text-gray-600 hover:text-gold-500 font-body font-medium"
            >
              <Mail className="w-4 h-4" />
              info@argroup.edu
            </a>
          </div>
          <div className="flex gap-4">
            <a href="#" className="text-gray-600 hover:text-gold-500 transition-colors">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="text-gray-600 hover:text-gold-500 transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="text-gray-600 hover:text-gold-500 transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={`sticky top-0 z-50 overflow-visible border-b transition-shadow duration-200 ${
          isScrolled ? 'border-gray-200 bg-white shadow-md' : 'border-gray-100 bg-white'
        }`}
      >
        <div className="nav-mega-root relative" onMouseLeave={closeMega}>
          <div className="relative mx-auto flex max-w-6xl items-center justify-between overflow-visible px-4 py-1.5">
            {/* Logo */}
            <div onMouseEnter={closeMega}>
              <BrandLogoLink frameClassName="brand-logo-link__frame--nav">
                <img
                  src="/ar-group-logo.png"
                  alt=""
                  width={96}
                  height={96}
                  decoding="async"
                  fetchPriority="high"
                  className="brand-logo-link__img"
                />
              </BrandLogoLink>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex flex-1 items-center justify-center gap-1 overflow-visible px-2">
              {NAV_LINKS.map((link: any) => (
                <div key={link.href} className={megaGroupClass(link.megaMenu)}>
                  {link.submenu ? (
                    link.megaMenu ? (
                      <Link
                        href={link.href}
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
                      onMouseEnter={closeMega}
                      className="text-navy-900 font-body font-medium text-sm hover:text-gold-600 transition-colors duration-300 px-3 py-2 relative flex items-center gap-1"
                    >
                      {link.label}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold-600 group-hover:w-full transition-all duration-300" />
                    </Link>
                  )}

                  {link.submenu && !link.megaMenu ? (
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

            {/* CTA Button */}
            <div className="hidden md:flex gap-4" onMouseEnter={closeMega}>
              <Button variant="primary" size="md">
                Free Counselling
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Desktop mega menus — full width, flush under navbar */}
          <div
            className={[
              'nav-mega-layer absolute inset-x-0 top-full hidden md:block',
              megaOpen ? 'nav-mega-layer--open' : '',
            ].join(' ')}
            onMouseEnter={cancelClose}
          >
            <div className={`mx-auto w-full px-4 pb-2 pt-0 ${megaInnerWidth}`}>
              {megaOpen === 'mbbs-india' ? <MbbsIndiaNavMegaMenu onNavigate={forceClose} /> : null}
              {megaOpen === 'mbbs-abroad' ? <MbbsAbroadNavMegaMenu onNavigate={forceClose} /> : null}
              {megaOpen === 'md-ms' ? <MdMsNavMegaMenu onNavigate={forceClose} /> : null}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white animate-in fade-in duration-200">
            <div className="px-4 py-4 space-y-2">
              {NAV_LINKS.map((link: any) => (
                <div key={link.href}>
                  {link.submenu ? (
                    <>
                      <div className="flex items-center gap-1">
                        <Link
                          href={link.href}
                          className="flex-1 text-navy-900 font-body font-semibold hover:text-gold-600 py-2"
                          onClick={() => setIsOpen(false)}
                        >
                          {link.label} hub →
                        </Link>
                        <button
                          type="button"
                          onClick={() => setOpenSubmenu(openSubmenu === link.href ? null : link.href)}
                          className="rounded-md p-2 text-navy-900 hover:bg-gold-50"
                          aria-label={`Expand ${link.label} menu`}
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              openSubmenu === link.href ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={link.href}
                      className="block text-navy-900 font-body font-medium hover:text-gold-500 py-2"
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )}

                  {link.submenu && openSubmenu === link.href && (
                    <div className="pl-2 py-2 max-h-[70vh] overflow-y-auto overscroll-contain">
                      {link.megaMenu === 'mbbs-india'
                        ? link.submenu.map(
                            (item: {
                              href: string
                              label: string
                              stateName?: string
                              colleges?: { label: string; href: string }[]
                            }) => (
                              <div key={item.href} className="mb-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenMobileState(
                                      openMobileState === item.href ? null : item.href
                                    )
                                  }
                                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-medium text-navy-900 hover:bg-gold-50"
                                >
                                  MBBS in {item.stateName ?? item.label}
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${
                                      openMobileState === item.href ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>
                                {openMobileState === item.href && item.colleges ? (
                                  <div className="ml-2 border-l border-slate-200 pl-3 pb-2">
                                    {item.colleges.map((college) => (
                                      <Link
                                        key={college.href + college.label}
                                        href={college.href}
                                        className="block py-1.5 text-xs text-navy-800 hover:text-gold-600"
                                        onClick={() => {
                                          setIsOpen(false)
                                          setOpenSubmenu(null)
                                          setOpenMobileState(null)
                                        }}
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
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next =
                                        openMobileState === item.href ? null : item.href
                                      setOpenMobileState(next)
                                      setOpenMobileUniversity(null)
                                    }}
                                    className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-medium text-navy-900 hover:bg-gold-50"
                                  >
                                    MBBS in {item.countryName ?? item.label}
                                    <ChevronDown
                                      className={`h-4 w-4 transition-transform ${
                                        openMobileState === item.href ? 'rotate-180' : ''
                                      }`}
                                    />
                                  </button>
                                  {openMobileState === item.href && item.universities ? (
                                    <div className="ml-2 border-l border-slate-200 pl-3 pb-2">
                                      {item.universities.map((university) => (
                                        <div key={university.href} className="mb-1">
                                          {university.colleges?.length ? (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setOpenMobileUniversity(
                                                    openMobileUniversity === university.href
                                                      ? null
                                                      : university.href
                                                  )
                                                }
                                                className="flex w-full items-center justify-between rounded-md px-1 py-1.5 text-left text-xs font-medium text-navy-900 hover:bg-gold-50"
                                              >
                                                <span className="pr-2">{university.label}</span>
                                                <ChevronDown
                                                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                                                    openMobileUniversity === university.href
                                                      ? 'rotate-180'
                                                      : ''
                                                  }`}
                                                />
                                              </button>
                                              {openMobileUniversity === university.href ? (
                                                <div className="ml-2 border-l border-slate-100 pl-2">
                                                  {university.colleges.map((college) => (
                                                    <Link
                                                      key={college.href + college.label}
                                                      href={college.href}
                                                      className="block py-1 text-xs text-navy-800 hover:text-gold-600"
                                                      onClick={() => {
                                                        setIsOpen(false)
                                                        setOpenSubmenu(null)
                                                        setOpenMobileState(null)
                                                        setOpenMobileUniversity(null)
                                                      }}
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
                                              onClick={() => {
                                                setIsOpen(false)
                                                setOpenSubmenu(null)
                                                setOpenMobileState(null)
                                                setOpenMobileUniversity(null)
                                              }}
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
                                          onClick={() => {
                                            setIsOpen(false)
                                            setOpenSubmenu(null)
                                            setOpenMobileState(null)
                                            setOpenMobileUniversity(null)
                                          }}
                                        >
                                          {college.label}
                                        </Link>
                                      ))}
                                    </div>
                                  ) : null}
                                  {openMobileState === item.href &&
                                  !item.universities &&
                                  (!item.colleges || item.colleges.length === 0) ? (
                                    <div className="ml-2 border-l border-slate-200 pl-3 pb-2">
                                      <Link
                                        href={item.href}
                                        className="block py-1.5 text-xs text-navy-800 hover:text-gold-600"
                                        onClick={() => {
                                          setIsOpen(false)
                                          setOpenSubmenu(null)
                                          setOpenMobileState(null)
                                        }}
                                      >
                                        View {item.countryName ?? item.label}
                                      </Link>
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
                          onClick={() => setIsOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Button variant="primary" className="w-full mt-4" onClick={() => setIsOpen(false)}>
                Free Counselling
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/919999999999"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center z-40 hover:bg-green-600 hover:scale-105 active:scale-95 transition-transform duration-200"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </>
  );
};
