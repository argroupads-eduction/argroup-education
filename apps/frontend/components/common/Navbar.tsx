'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
import { MbbsAbroadNavMegaMenu } from '@/components/common/MbbsAbroadNavMegaMenu';
import { MbbsIndiaNavMegaMenu } from '@/components/common/MbbsIndiaNavMegaMenu';
import { Button } from '@/components/ui/Button';
import { useScrollPosition, usePrevious } from '@/hooks';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [openMobileState, setOpenMobileState] = useState<string | null>(null);
  const [openMobileUniversity, setOpenMobileUniversity] = useState<string | null>(null);
  const scrollPosition = useScrollPosition();
  const previousScrollPosition = usePrevious(scrollPosition);
  const isScrolled = scrollPosition > 50;
  const isScrollingUp = previousScrollPosition === undefined || scrollPosition < previousScrollPosition;
  const logoScale = isScrollingUp ? 1 : 0.88;

  return (
    <>
      {/* Top Bar */}
      <motion.div
        className={`hidden md:block border-b transition-colors ${
          isScrolled ? 'bg-white border-gray-200' : 'bg-navy-50 border-gray-100'
        }`}
        animate={{ backgroundColor: isScrolled ? '#ffffff' : '#f0f4f8' }}
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
      </motion.div>

      {/* Main Navbar */}
      <motion.nav
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          isScrolled ? 'border-gray-200 bg-white shadow-md' : 'border-gray-100 bg-white'
        }`}
        initial={{ y: 0 }}
        animate={{ y: 0 }}
      >
        <div className="max-w-6xl mx-auto px-4 py-1.5 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <motion.div animate={{ scale: logoScale }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
              <img
                src="/ar-group-logo.webp"
                alt="AR Group of Education"
                width={96}
                height={96}
                decoding="async"
                fetchPriority="high"
                className="h-14 w-14 md:h-20 md:w-20 object-contain"
              />
            </motion.div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link: any) => (
              <div
                key={link.href}
                className={
                  link.megaMenu === 'mbbs-india'
                    ? 'relative group/mbbs-india'
                    : link.megaMenu === 'mbbs-abroad'
                      ? 'relative group/mbbs-abroad'
                      : 'relative group'
                }
              >
                {link.submenu ? (
                  <button
                    type="button"
                    className="text-navy-900 font-body font-medium text-sm hover:text-gold-600 transition-colors duration-300 px-3 py-2 relative group flex items-center gap-1"
                  >
                    {link.label}
                    <ChevronDown className="w-4 h-4" />
                    <span
                      className={`absolute bottom-0 left-0 w-0 h-0.5 bg-gold-600 transition-all duration-300 ${
                        link.megaMenu === 'mbbs-india'
                          ? 'group-hover/mbbs-india:w-full'
                          : link.megaMenu === 'mbbs-abroad'
                            ? 'group-hover/mbbs-abroad:w-full'
                            : 'group-hover:w-full'
                      }`}
                    />
                  </button>
                ) : (
                  <Link
                    href={link.href}
                    className="text-navy-900 font-body font-medium text-sm hover:text-gold-600 transition-colors duration-300 px-3 py-2 relative flex items-center gap-1"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold-600 group-hover:w-full transition-all duration-300" />
                  </Link>
                )}

                {link.submenu && link.megaMenu === 'mbbs-india' ? (
                  <div className="absolute left-0 top-full z-50 pt-2 opacity-0 invisible pointer-events-none transition-all duration-200 group-hover/mbbs-india:opacity-100 group-hover/mbbs-india:visible group-hover/mbbs-india:pointer-events-auto">
                    <MbbsIndiaNavMegaMenu />
                  </div>
                ) : null}
                {link.submenu && link.megaMenu === 'mbbs-abroad' ? (
                  <div className="absolute left-0 top-full z-50 pt-2 opacity-0 invisible pointer-events-none transition-all duration-200 group-hover/mbbs-abroad:opacity-100 group-hover/mbbs-abroad:visible group-hover/mbbs-abroad:pointer-events-auto">
                    <MbbsAbroadNavMegaMenu />
                  </div>
                ) : null}
                {link.submenu && link.megaMenu !== 'mbbs-india' && link.megaMenu !== 'mbbs-abroad' ? (
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
          <div className="hidden md:flex gap-4">
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

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            className="md:hidden border-t border-gray-200 bg-white"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="px-4 py-4 space-y-2">
              {NAV_LINKS.map((link: any) => (
                <div key={link.href}>
                  {link.submenu ? (
                    <button
                      onClick={() => setOpenSubmenu(openSubmenu === link.href ? null : link.href)}
                      className="w-full text-left text-navy-900 font-body font-medium hover:text-gold-500 py-2 flex items-center justify-between"
                    >
                      {link.label}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          openSubmenu === link.href ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
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
                    <motion.div
                      className="pl-2 py-2 max-h-[70vh] overflow-y-auto"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
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
                    </motion.div>
                  )}
                </div>
              ))}
              <Button variant="primary" className="w-full mt-4" onClick={() => setIsOpen(false)}>
                Free Counselling
              </Button>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* WhatsApp Floating Button */}
      <motion.a
        href="https://wa.me/919999999999"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center z-40 hover:bg-green-600 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="w-6 h-6" />
      </motion.a>
    </>
  );
};
