'use client';

import Link from 'next/link';
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Youtube,
  Twitter,
} from 'lucide-react';
import { BrandLogoLink } from '@/components/common/BrandLogoLink';
import { Button } from '@/components/ui/Button';
import { CONTACT_INFO, SITE_DESCRIPTION, SITE_NAME, SOCIAL_LINKS } from '@/lib/constants';
import { MBBS_ABROAD_COUNTRIES } from '@/lib/mbbsAbroadTree';
import { FooterAirportDiaries } from './footer/FooterAirportDiaries';
import '@/styles/footer-main.css';

const COMPANY_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Disclaimer', href: '/disclaimer' },
] as const;

const PROGRAM_LINKS = [
  { label: 'MBBS in India', href: '/mbbs-india' },
  { label: 'MBBS Abroad', href: '/mbbs-abroad' },
  { label: 'MD / MS', href: '/md-ms' },
  { label: 'Blog & Updates', href: '/blog' },
  { label: 'Services', href: '/services' },
] as const;

const FEATURED_ABROAD = MBBS_ABROAD_COUNTRIES.slice(0, 6);

function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits ? `tel:+${digits.replace(/^0+/, '')}` : '#';
}

function socialIcon(platform: string) {
  switch (platform) {
    case 'facebook':
      return Facebook;
    case 'instagram':
      return Instagram;
    case 'linkedin':
      return Linkedin;
    case 'youtube':
      return Youtube;
    case 'twitter':
      return Twitter;
    default:
      return null;
  }
}

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-900 text-white">
      <FooterAirportDiaries />

      <div className="site-footer-main">
        <div className="site-footer-main__inner">
          <div className="site-footer-main__top">
            {/* AR Group brand */}
            <div className="site-footer-main__brand">
              <BrandLogoLink frameClassName="brand-logo-link__frame--footer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ar-group-logo.png"
                  alt=""
                  width={88}
                  height={88}
                  className="brand-logo-link__img"
                  loading="lazy"
                  decoding="async"
                />
              </BrandLogoLink>
              <p className="site-footer-main__desc">{SITE_DESCRIPTION}</p>
              <Link href="/contact" className="mt-4 inline-block">
                <Button variant="primary" size="md">
                  Talk To Advisor
                </Button>
              </Link>
              <div className="site-footer-main__contact">
                <a href={telHref(CONTACT_INFO.phone)}>
                  <Phone className="h-3.5 w-3.5 shrink-0 text-gold-500" />
                  {CONTACT_INFO.phone}
                </a>
                <a href={`mailto:${CONTACT_INFO.email}`}>
                  <Mail className="h-3.5 w-3.5 shrink-0 text-gold-500" />
                  {CONTACT_INFO.email}
                </a>
                <span className="inline-flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-500" />
                  {CONTACT_INFO.address}
                </span>
              </div>
            </div>

            {/* Compact link columns */}
            <div className="site-footer-main__links">
              <div className="site-footer-main__col">
                <h4 className="site-footer-main__col-title">Company</h4>
                <ul>
                  {COMPANY_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="site-footer-main__col">
                <h4 className="site-footer-main__col-title">Programs</h4>
                <ul>
                  {PROGRAM_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="site-footer-main__col">
                <h4 className="site-footer-main__col-title">Top destinations</h4>
                <div className="site-footer-main__chips">
                  {FEATURED_ABROAD.map((c) => (
                    <Link key={c.id} href={c.href} className="site-footer-main__chip">
                      {c.name}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/mbbs-abroad"
                  className="mt-2 inline-block text-xs font-semibold text-gold-400 hover:text-gold-300"
                >
                  View all countries →
                </Link>
              </div>
            </div>

            {/* Partner brand — Collegedunias */}
            <div className="site-footer-main__partner">
              <p className="site-footer-main__partner-label">Partner brand</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/collegedunias-logo.png"
                alt="Collegedunias — Surety to Success"
                width={168}
                height={72}
                className="site-footer-main__partner-logo"
                loading="lazy"
                decoding="async"
              />
              <p className="site-footer-main__partner-tag">&ldquo;Surety to Success&rdquo;</p>
            </div>
          </div>

          <div className="site-footer-main__bottom">
            <div className="site-footer-main__social">
              <span className="site-footer-main__social-label">Follow us</span>
              {SOCIAL_LINKS.map((social) => {
                const Icon = socialIcon(social.platform);
                if (!Icon || social.platform === 'whatsapp') return null;
                return (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="site-footer-main__social-link"
                    aria-label={social.platform}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                );
              })}
            </div>
            <div className="site-footer-main__legal">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/disclaimer">Disclaimer</Link>
              <Link href="/sitemap">Sitemap</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="site-footer-bar">
        <div className="site-footer-bar__inner">
          <p>
            &copy; {year} {SITE_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
