'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const Footer = () => {
  return (
    <footer className="bg-navy-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-4">
              AR<span className="text-gold-500">GRUPO</span>
            </h3>
            <p className="text-gray-400 mb-6">
              Premium educational consultancy for medical education abroad.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-gold-500 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-gold-500 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-gold-500 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="font-bold mb-6">Quick Links</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link href="/" className="hover:text-gold-500 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-gold-500 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-gold-500 transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-gold-500 transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="font-bold mb-6">Services</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link href="/countries" className="hover:text-gold-500 transition-colors">
                  MBBS Abroad
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-gold-500 transition-colors">
                  Admission Guidance
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-gold-500 transition-colors">
                  Visa Assistance
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-gold-500 transition-colors">
                  Scholarship Help
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="font-bold mb-6">Newsletter</h4>
            <p className="text-gray-400 mb-4">
              Subscribe for latest updates and tips.
            </p>
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="Your email"
                className="bg-navy-800 border-navy-700 text-white placeholder:text-gray-500"
              />
              <Button variant="primary" className="w-full">
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Contact Info */}
        <motion.div
          className="border-t border-navy-700 py-8 grid grid-cols-1 md:grid-cols-3 gap-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <a href="tel:+918001234567" className="flex items-center gap-3 text-gray-400 hover:text-gold-500">
            <Phone className="w-5 h-5" />
            <div>
              <p className="text-xs text-gray-500">Call us</p>
              <p className="font-semibold">+91 (800) 123-4567</p>
            </div>
          </a>
          <a href="mailto:info@argroup.edu" className="flex items-center gap-3 text-gray-400 hover:text-gold-500">
            <Mail className="w-5 h-5" />
            <div>
              <p className="text-xs text-gray-500">Email us</p>
              <p className="font-semibold">info@argroup.edu</p>
            </div>
          </a>
          <div className="flex items-center gap-3 text-gray-400">
            <MapPin className="w-5 h-5" />
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-semibold">New Delhi, India</p>
            </div>
          </div>
        </motion.div>

        {/* Bottom */}
        <div className="border-t border-navy-700 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
          <p>&copy; 2024 AR Group of Education. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-gold-500 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gold-500 transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/disclaimer" className="hover:text-gold-500 transition-colors">
              Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
