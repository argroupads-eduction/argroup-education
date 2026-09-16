'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  Globe2,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import { CounsellingForm } from '@/components/forms/CounsellingForm';
import { CONTACT_INFO } from '@/lib/constants';
import '@/styles/contact-page.css';

const CHANNELS = [
  {
    id: 'call',
    icon: Phone,
    title: 'Call counsellors',
    desc: '24×7 helpline for NEET rank, fees and admission timelines explained clearly.',
    href: `tel:${CONTACT_INFO.phoneTel}`,
    cta: CONTACT_INFO.phone,
    accent: 'contact-channel--gold',
    tag: '24×7',
  },
  {
    id: 'email',
    icon: Mail,
    title: 'Email us',
    desc: 'Share documents or detailed queries. We respond within one business day.',
    href: `mailto:${CONTACT_INFO.email}`,
    cta: CONTACT_INFO.email,
    accent: 'contact-channel--navy',
    tag: 'Reply fast',
  },
  {
    id: 'whatsapp',
    icon: MessageCircle,
    title: 'WhatsApp',
    desc: 'Quick answers on colleges, countries and counselling slots in Hindi or English.',
    href: CONTACT_INFO.whatsapp,
    cta: 'Open WhatsApp',
    external: true,
    accent: 'contact-channel--emerald',
    tag: 'Instant',
  },
] as const;

const PROMISES = [
  { icon: ShieldCheck, text: '100% confidential. No spam calls.' },
  { icon: GraduationCap, text: 'MBBS India & Abroad under one roof' },
  { icon: Stethoscope, text: 'MD/MS & postgraduate pathways' },
  { icon: Globe2, text: '19+ years · 4,000+ students guided' },
] as const;

const HERO_STATS = [
  { value: '24×7', label: 'Counselling desk' },
  { value: '4,000+', label: 'Students guided' },
  { value: '<2h', label: 'Avg. response' },
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function ContactPageView() {
  return (
    <div className="contact-page">
      <section className="contact-hero" aria-labelledby="contact-hero-title">
        <div className="contact-hero__grid-bg" aria-hidden />
        <div className="contact-hero__mesh" aria-hidden />
        <div className="contact-hero__orb contact-hero__orb--a" aria-hidden />
        <div className="contact-hero__orb contact-hero__orb--b" aria-hidden />

        <div className="contact-hero__inner">
          <motion.span
            className="contact-hero__kicker"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Expert · Trusted · Confidential
          </motion.span>

          <motion.h1
            id="contact-hero-title"
            className="contact-hero__title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
          >
            Let&apos;s plan your{' '}
            <span className="contact-hero__title-accent">medical future</span> together
          </motion.h1>

          <motion.p
            className="contact-hero__lead"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            Visit our Noida office or book expert counselling online. AR Group helps with MBBS in
            India and abroad, from NEET counselling and college selection to visa and pre-departure
            support.
          </motion.p>

          <motion.div
            className="contact-hero__location-pill"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.15 }}
          >
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            <span>
              {CONTACT_INFO.addressLines[0]} · {CONTACT_INFO.addressLines[1]},{' '}
              {CONTACT_INFO.addressLines[2]}
            </span>
          </motion.div>

          <motion.div
            className="contact-hero__action-bar"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
          >
            <a href="#contact-form" className="contact-hero__cta-primary">
              <span>Book expert counselling</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </a>
            <span className="contact-hero__action-divider" aria-hidden />
            <a href={`tel:${CONTACT_INFO.phoneTel}`} className="contact-hero__call-block">
              <span className="contact-hero__call-icon-wrap">
                <Phone className="h-4 w-4" aria-hidden />
              </span>
              <span className="contact-hero__call-text">
                <span className="contact-hero__call-label">Call us · {CONTACT_INFO.hoursShort}</span>
                <span className="contact-hero__call-number">{CONTACT_INFO.phone}</span>
              </span>
            </a>
          </motion.div>

          <motion.ul
            className="contact-hero__stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.24 }}
            aria-label="Quick facts"
          >
            {HERO_STATS.map((s) => (
              <li key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </li>
            ))}
          </motion.ul>
        </div>
      </section>

      <section className="contact-channels" aria-label="Contact methods">
        <div className="contact-channels__inner">
          {CHANNELS.map((ch, i) => {
            const Icon = ch.icon;
            const CardInner = (
              <>
                <span className="contact-channel__tag">{ch.tag}</span>
                <span className={`contact-channel__icon-wrap ${ch.accent}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="contact-channel__title">{ch.title}</h2>
                <p className="contact-channel__desc">{ch.desc}</p>
                <span className="contact-channel__cta">
                  {ch.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </>
            );

            return (
              <motion.div
                key={ch.id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp}
              >
                {'external' in ch && ch.external ? (
                  <a
                    href={ch.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-channel group"
                  >
                    {CardInner}
                  </a>
                ) : (
                  <a href={ch.href} className="contact-channel group">
                    {CardInner}
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="contact-main" id="contact-form" aria-labelledby="contact-form-heading">
        <div className="contact-main__backdrop" aria-hidden />
        <div className="contact-main__inner">
          <motion.div
            className="contact-main__copy"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp}
            custom={0}
          >
            <span className="contact-main__kicker">Expert counselling team</span>
            <h2 id="contact-form-heading" className="contact-main__title">
              Book your{' '}
              <span className="contact-main__accent">expert counselling</span> session
            </h2>
            <p className="contact-main__lead">
              Fill in your details. Our counsellors call within 24 hours with MBBS India and abroad
              options, plus a clear fee breakdown. No obligation.
            </p>

            <ul className="contact-promises">
              {PROMISES.map(({ icon: Icon, text }, idx) => (
                <li key={text} style={{ '--promise-i': idx } as CSSProperties}>
                  <span className="contact-promises__num">{idx + 1}</span>
                  <Icon className="contact-promises__icon" aria-hidden />
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <div className="contact-office-card">
              <div className="contact-office-card__head">
                <Building2 className="contact-office-card__building" aria-hidden />
                <div>
                  <p className="contact-office-card__label">Visit our office</p>
                  <p className="contact-office-card__city">{CONTACT_INFO.city}</p>
                </div>
                <span className="contact-office-card__hours-badge">{CONTACT_INFO.hoursShort}</span>
              </div>
              <address className="contact-office-card__address not-italic">
                {CONTACT_INFO.addressLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </address>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  'Wave Silver Tower Sector 18 Noida Office 523'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-office-card__map-link"
              >
                Open in Google Maps
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="contact-response-badge">
              <span className="contact-response-badge__dot" aria-hidden />
              {CONTACT_INFO.hours} · Avg. callback under 2 hours
            </div>
          </motion.div>

          <motion.div
            className="contact-form-shell"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp}
            custom={1}
          >
            <div className="contact-form-shell__glow" aria-hidden />
            <div className="contact-form-shell__card">
              <div className="contact-form-shell__head">
                <div className="contact-form-shell__live">
                  <span className="contact-form-shell__live-dot" aria-hidden />
                  Counsellors online
                </div>
                <h3 className="contact-form-shell__title">Counselling request</h3>
                <p className="contact-form-shell__sub">
                  MBBS India · MBBS Abroad · MD/MS guidance
                </p>
              </div>
              <CounsellingForm embedded submitSource="contact-page" />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="contact-footer-cta">
        <div className="contact-footer-cta__inner">
          <p className="contact-footer-cta__text">
            Prefer browsing first? Explore state-wise colleges and countries.
          </p>
          <div className="contact-footer-cta__actions">
            <Link href="/mbbs-india" className="contact-footer-link ui-btn ui-btn--secondary ui-btn--pill ui-btn--sm">
              MBBS India
            </Link>
            <Link href="/mbbs-abroad" className="contact-footer-link ui-btn ui-btn--secondary ui-btn--pill ui-btn--sm">
              MBBS Abroad
            </Link>
            <Link href="/" className="contact-footer-link ui-btn ui-btn--navy ui-btn--pill ui-btn--sm">
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
