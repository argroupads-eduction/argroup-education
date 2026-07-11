'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Building2,
  ExternalLink,
  FileCheck,
  GraduationCap,
  Plane,
  Scale,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DISCLAIMER_CLOSING,
  DISCLAIMER_LAST_UPDATED,
  DISCLAIMER_SECTIONS,
} from '@/lib/disclaimerContent';
import '@/styles/disclaimer-page.css';

const SECTION_ICONS: Record<string, LucideIcon> = {
  'information-accuracy': FileCheck,
  'educational-consultancy': GraduationCap,
  'university-admissions': Building2,
  'visa-assistance': Plane,
  'external-websites': ExternalLink,
  'service-responsibility': ShieldCheck,
  'user-responsibility': UserCheck,
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function DisclaimerPageView() {
  return (
    <div className="disclaimer-page">
      <section className="disclaimer-hero" aria-labelledby="disclaimer-hero-heading">
        <div className="disclaimer-hero__grid-bg" aria-hidden />
        <div className="disclaimer-hero__mesh" aria-hidden />
        <div className="disclaimer-hero__orb disclaimer-hero__orb--a" aria-hidden />
        <div className="disclaimer-hero__orb disclaimer-hero__orb--b" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-4">
          <span className="disclaimer-hero__eyebrow">
            <Scale className="h-3.5 w-3.5" aria-hidden />
            Legal notice
          </span>

          <h1 id="disclaimer-hero-heading" className="disclaimer-hero__title">
            Website <em>Disclaimer</em>
          </h1>

          <p className="disclaimer-hero__lead">
            Transparent guidance for students and parents exploring MBBS in India, study abroad
            pathways, and counselling support. Please read how we share information and where
            responsibility lies.
          </p>

          <div className="disclaimer-hero__meta">
            <span className="disclaimer-hero__pill">Last updated: {DISCLAIMER_LAST_UPDATED}</span>
            <span className="disclaimer-hero__pill">7 key sections</span>
          </div>
        </div>
      </section>

      <div className="disclaimer-body">
        <div className="disclaimer-body__inner">
          <aside className="disclaimer-toc" aria-label="Disclaimer sections">
            <p className="disclaimer-toc__title">On this page</p>
            <nav className="disclaimer-toc__list">
              {DISCLAIMER_SECTIONS.map((section) => (
                <a key={section.id} href={`#${section.id}`} className="disclaimer-toc__link">
                  <span className="disclaimer-toc__num">{section.number}.</span>
                  <span>{section.title}</span>
                </a>
              ))}
            </nav>
          </aside>

          <div className="min-w-0">
            <div className="disclaimer-sections">
              {DISCLAIMER_SECTIONS.map((section, index) => {
                const Icon = SECTION_ICONS[section.id] ?? FileCheck;

                return (
                  <motion.article
                    key={section.id}
                    id={section.id}
                    className="disclaimer-card"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-40px' }}
                    custom={index}
                    variants={fadeUp}
                  >
                    <div className="disclaimer-card__icon-wrap" aria-hidden>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="disclaimer-card__head">
                        <span className="disclaimer-card__num">{section.number}</span>
                        <h2 className="disclaimer-card__title">{section.title}</h2>
                      </div>
                      <p className="disclaimer-card__body">{section.body}</p>
                    </div>
                  </motion.article>
                );
              })}
            </div>

            <motion.div
              className="disclaimer-mission"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              custom={DISCLAIMER_SECTIONS.length}
              variants={fadeUp}
            >
              <p className="disclaimer-mission__label">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Our commitment
              </p>
              <p className="disclaimer-mission__text">{DISCLAIMER_CLOSING}</p>
            </motion.div>

            <div className="disclaimer-footer">
              <div className="disclaimer-related" aria-label="Related legal pages">
                <Link href="/privacy" className="disclaimer-related__card">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="disclaimer-related__card">
                  Terms &amp; Conditions
                </Link>
                <Link href="/contact" className="disclaimer-related__card">
                  Contact counsellors
                </Link>
              </div>

              <Link href="/">
                <Button variant="navy">Back to Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
