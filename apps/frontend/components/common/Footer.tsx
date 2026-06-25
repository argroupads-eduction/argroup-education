'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { BrandLogoLink } from '@/components/common/BrandLogoLink';
import { Button } from '@/components/ui/Button';
import { CONTACT_INFO, SOCIAL_LINKS } from '@/lib/constants';
import { MBBS_ABROAD_COUNTRIES } from '@/lib/mbbsAbroadTree';
import { FooterAirportDiaries } from './footer/FooterAirportDiaries';
import { FooterFollowUs } from './footer/FooterFollowUs';
import { useDynamicNavPages } from '@/components/common/NavPagesProvider';
import { useSiteGlobals } from '@/components/common/SiteGlobalsProvider';
import { navPagesForSection } from '@/lib/dynamicNav';
import { mergeContactInfo, mergeLinkLists, mergeSocialLinks } from '@/lib/siteGlobals';

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
  { label: 'NEET Rank Predictor', href: '/neet-rank-predictor' },
  { label: 'Blog & Updates', href: '/blog' },
  { label: 'Services', href: '/services' },
] as const;

const FEATURED_ABROAD = MBBS_ABROAD_COUNTRIES.slice(0, 6);

function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits ? `tel:+${digits.replace(/^0+/, '')}` : '#';
}

export const Footer = () => {
  const year = new Date().getFullYear();
  const navPages = useDynamicNavPages();
  const siteGlobals = useSiteGlobals();
  const contactInfo = useMemo(
    () => mergeContactInfo(CONTACT_INFO, siteGlobals['site-settings']),
    [siteGlobals]
  );
  const socialLinks = useMemo(
    () => mergeSocialLinks(SOCIAL_LINKS, siteGlobals['site-settings']?.socialLinks),
    [siteGlobals]
  );
  const programLinks = useMemo(
    () => mergeLinkLists(PROGRAM_LINKS, siteGlobals.footer?.programLinks),
    [siteGlobals]
  );
  const footerLinks = useMemo(() => {
    const companyBase = mergeLinkLists(COMPANY_LINKS, siteGlobals.footer?.companyLinks);
    const extras = navPagesForSection(navPages, 'footer').map((p) => ({
      label: p.label,
      href: p.href,
    }));
    return mergeLinkLists(companyBase, extras);
  }, [navPages, siteGlobals]);

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
                  alt="AR Group of Education"
                  width={84}
                  height={84}
                  className="brand-logo-link__img"
                  loading="lazy"
                  decoding="async"
                />
              </BrandLogoLink>
              <p className="site-footer-main__desc">
                <span className="font-semibold text-slate-200">AR Group of Education</span> is your
                trusted partner for{' '}
                <span className="font-bold text-gold-400">MBBS INDIA</span> &amp;{' '}
                <span className="font-bold text-gold-400">MBBS ABROAD</span> admissions, NEET
                counselling &amp; end-to-end visa support.
              </p>
              <Link href="/contact" className="mt-4 inline-block">
                <Button variant="primary" size="md">
                  Talk To Advisor
                </Button>
              </Link>
              <div className="site-footer-main__contact">
                <a href={telHref(contactInfo.phone ?? CONTACT_INFO.phone)}>
                  <Phone className="h-3.5 w-3.5 shrink-0 text-gold-500" />
                  {contactInfo.phone}
                </a>
                <a href={`mailto:${contactInfo.email}`}>
                  <Mail className="h-3.5 w-3.5 shrink-0 text-gold-500" />
                  {contactInfo.email}
                </a>
                <span className="inline-flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-500" />
                  {contactInfo.address}
                </span>
              </div>
            </div>

            {/* Compact link columns */}
            <div className="site-footer-main__links">
              <div className="site-footer-main__col">
                <h4 className="site-footer-main__col-title">Company</h4>
                <ul>
                  {footerLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="site-footer-main__col">
                <h4 className="site-footer-main__col-title">Programs</h4>
                <ul>
                  {programLinks.map((link) => (
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
              <p className="site-footer-main__partner-label">Our Partner</p>
              <a
                href="https://collegedunias.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="site-footer-main__partner-link"
                aria-label="Collegedunias — our partner brand"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/collegedunias-logo.png"
                  alt="Collegedunias"
                  width={240}
                  height={88}
                  className="site-footer-main__partner-logo"
                  loading="lazy"
                  decoding="async"
                />
              </a>
              <FooterFollowUs
                socialLinks={socialLinks}
                email={contactInfo.email ?? CONTACT_INFO.email}
              />
            </div>
          </div>

          <div className="site-footer-main__bottom">
            <p className="site-footer-main__copyright">
              &copy; AR 2008&ndash;{year}. All rights reserved.
            </p>
            <div className="site-footer-main__legal">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/disclaimer">Disclaimer</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
