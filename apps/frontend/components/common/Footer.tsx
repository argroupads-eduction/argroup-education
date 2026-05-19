'use client'

import Link from 'next/link'
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Youtube,
  Twitter,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  CONTACT_INFO,
  SITE_DESCRIPTION,
  SITE_NAME,
  SOCIAL_LINKS,
} from '@/lib/constants'
import { MBBS_ABROAD_COUNTRIES, mbbsAbroadCountryHref } from '@/lib/mbbsAbroadCollegesByCountry'
import { FooterMbbsAbroadGrid } from './footer/FooterMbbsAbroadGrid'
import { FooterMbbsIndiaGrid } from './footer/FooterMbbsIndiaGrid'

const COMPANY_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Disclaimer', href: '/disclaimer' },
] as const

const RESOURCES_LINKS = [
  { label: 'Blog & Updates', href: '/blog' },
  { label: 'Sitemap', href: '/sitemap' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
] as const

const LEARN_MORE_LINKS = [
  { label: 'MBBS in India', href: '/mbbs-india' },
  { label: 'MBBS Abroad', href: '/mbbs-abroad' },
  { label: 'MD / MS', href: '/md-ms' },
  { label: 'Countries', href: '/countries' },
] as const

function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits ? `tel:+${digits.replace(/^0+/, '')}` : '#'
}

function socialIcon(platform: string) {
  switch (platform) {
    case 'facebook':
      return Facebook
    case 'instagram':
      return Instagram
    case 'linkedin':
      return Linkedin
    case 'youtube':
      return Youtube
    case 'twitter':
      return Twitter
    default:
      return null
  }
}

function FooterLinkColumn({
  title,
  links,
}: {
  title: string
  links: readonly { label: string; href: string }[]
}) {
  return (
    <div>
      <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-gold-500">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-gray-300 transition-colors hover:text-gold-400"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-navy-900 text-white">
      <FooterMbbsAbroadGrid />
      <FooterMbbsIndiaGrid />

      <div className="border-t border-gold-500/30 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12">
            {/* Brand */}
            <div className="lg:col-span-4">
              <Link href="/" className="inline-block">
                <h3 className="text-2xl font-bold font-display">
                  AR<span className="text-gold-500"> Group</span>
                </h3>
                <p className="text-sm text-gray-400">of Education</p>
              </Link>
              <p className="mt-4 text-sm leading-relaxed text-gray-400">{SITE_DESCRIPTION}</p>
              <Link href="/contact" className="mt-6 inline-block">
                <Button variant="primary" size="md">
                  Talk To Advisor
                </Button>
              </Link>
              <div className="mt-6 space-y-3 text-sm text-gray-400">
                <a
                  href={telHref(CONTACT_INFO.phone)}
                  className="flex items-center gap-2 transition-colors hover:text-gold-400"
                >
                  <Phone className="h-4 w-4 shrink-0 text-gold-500" />
                  {CONTACT_INFO.phone}
                </a>
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="flex items-center gap-2 transition-colors hover:text-gold-400"
                >
                  <Mail className="h-4 w-4 shrink-0 text-gold-500" />
                  {CONTACT_INFO.email}
                </a>
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
                  {CONTACT_INFO.address}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:col-span-1 lg:col-span-5 lg:grid-cols-3">
              <FooterLinkColumn title="Company" links={COMPANY_LINKS} />
              <FooterLinkColumn
                title="Study MBBS In"
                links={MBBS_ABROAD_COUNTRIES.map((c) => ({
                  label: c.name,
                  href: mbbsAbroadCountryHref(c.id),
                }))}
              />
              <FooterLinkColumn title="Resources" links={RESOURCES_LINKS} />
            </div>

            <div className="lg:col-span-3">
              <FooterLinkColumn title="Learn More" links={LEARN_MORE_LINKS} />
            </div>
          </div>

          {/* Social */}
          <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-navy-700 pt-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Follow us
            </span>
            <div className="flex flex-wrap gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = socialIcon(social.platform)
                if (!Icon || social.platform === 'whatsapp') return null
                return (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-500/30 text-gray-300 transition-colors hover:border-gold-500 hover:bg-gold-500/10 hover:text-gold-400"
                    aria-label={social.platform}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gold-500/20 bg-navy-950 py-5">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-3 px-4 text-center text-sm text-gray-500 md:flex-row md:text-left">
          <p>
            &copy; {year} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:justify-end">
            <Link href="/privacy" className="hover:text-gold-400 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-gold-400 transition-colors">
              Terms
            </Link>
            <Link href="/disclaimer" className="hover:text-gold-400 transition-colors">
              Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
