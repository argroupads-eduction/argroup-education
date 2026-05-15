'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Button } from '@/components/ui/Button';
import { useScrollPosition } from '@/hooks';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const scrollPosition = useScrollPosition();
  const isScrolled = scrollPosition > 50;

  return (
    <>
      {/* Top Bar */}
      <motion.div
        className={`hidden md:block border-b transition-colors ${
          isScrolled ? 'bg-white border-gray-200' : 'bg-navy-50 border-gray-100'
        }`}
        animate={{ backgroundColor: isScrolled ? '#ffffff' : '#f0f4f8' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center text-sm">
          <div className="flex gap-6">
            <a
              href="tel:+918001234567"
              className="flex items-center gap-2 text-gray-600 hover:text-gold-500"
            >
              <Phone className="w-4 h-4" />
              +91 (800) 123-4567
            </a>
            <a
              href="mailto:info@argroup.edu"
              className="flex items-center gap-2 text-gray-600 hover:text-gold-500"
            >
              <Mail className="w-4 h-4" />
              info@argroup.edu
            </a>
          </div>
          <div className="flex gap-4">
            <a
              href="#"
              className="text-gray-600 hover:text-gold-500 transition-colors"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-gold-500 transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-gold-500 transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>
      </motion.div>

      {/* Main Navbar */}
      <motion.nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white shadow-md' : 'bg-white'
        }`}
        initial={{ y: 0 }}
        animate={{ y: 0 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="font-serif font-bold text-2xl text-navy-900 flex flex-col items-center leading-none">
            <span className="text-3xl">AR</span>
            <span className="text-sm text-gold-600 font-body font-semibold tracking-widest">EDUCATION</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <div key={link.label} className="relative group">
                <Link
                  href={link.href}
                  className="text-navy-900 font-body font-medium text-sm hover:text-gold-600 transition-colors duration-300 px-3 py-2 rounded-md relative flex items-center gap-1 group"
                >
                  {link.label}
                  {link.type === 'dropdown' && (
                    <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                  )}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold-600 group-hover:w-full transition-all duration-300" />
                </Link>

                {/* Desktop Dropdown */}
                {link.type === 'dropdown' && link.submenu && (
                  <motion.div
                    className="absolute left-0 mt-0 w-56 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pt-2"
                    initial={{ opacity: 0, y: -10 }}
                    whileHover={{ opacity: 1, y: 0 }}
                  >
                    <div className="py-2">
                      {link.submenu.map((subitem) => (
                        <Link
                          key={subitem.label}
                          href={subitem.href}
                          className="block px-4 py-2 text-sm text-navy-900 hover:bg-gold-50 hover:text-gold-600 transition-colors font-body"
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
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
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="md:hidden border-t bg-white max-h-96 overflow-y-auto"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="px-4 py-4 space-y-2">
                {NAV_LINKS.map((link) => (
                  <div key={link.label}>
                    <div
                      className="flex items-center justify-between py-2 cursor-pointer"
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === link.label ? null : link.label
                        )
                      }
                    >
                      <Link
                        href={link.href}
                        className="text-navy-900 font-body font-medium hover:text-gold-600 flex-1"
                        onClick={() => link.type === 'link' && setIsOpen(false)}
                      >
                        {link.label}
                      </Link>
                      {link.type === 'dropdown' && (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            openDropdown === link.label ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </div>

                    {/* Mobile Dropdown */}
                    <AnimatePresence>
                      {link.type === 'dropdown' &&
                        link.submenu &&
                        openDropdown === link.label && (
                          <motion.div
                            className="bg-navy-50 rounded-md ml-4"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            {link.submenu.map((subitem) => (
                              <Link
                                key={subitem.label}
                                href={subitem.href}
                                className="block px-4 py-2 text-sm text-navy-900 hover:text-gold-600 font-body"
                                onClick={() => setIsOpen(false)}
                              >
                                {subitem.label}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </div>
                ))}

                <Button
                  variant="primary"
                  className="w-full mt-4"
                  onClick={() => setIsOpen(false)}
                >
                  Free Counselling
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
