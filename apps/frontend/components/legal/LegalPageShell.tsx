'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import '@/styles/legal-page.css';

export type LegalSection = {
  id: string;
  number: number;
  title: string;
  body?: string;
  bullets?: readonly string[];
  contact?: {
    email: string;
    phone: string;
    phoneTel: string;
  };
};

type LegalPageShellProps = {
  variant: 'terms' | 'privacy';
  pageId: string;
  eyebrow: string;
  eyebrowIcon: LucideIcon;
  title: ReactNode;
  lead: string;
  lastUpdated: string;
  sectionCountLabel: string;
  sections: readonly LegalSection[];
  sectionIcons: Record<string, LucideIcon>;
  closing?: {
    label: string;
    text: string;
  };
  relatedLinks: readonly { href: string; label: string }[];
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function LegalPageShell({
  variant,
  pageId,
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  lead,
  lastUpdated,
  sectionCountLabel,
  sections,
  sectionIcons,
  closing,
  relatedLinks,
}: LegalPageShellProps) {
  const DefaultIcon = Object.values(sectionIcons)[0];

  return (
    <div className={`legal-page legal-page--${variant}`}>
      <section className="legal-hero" aria-labelledby={`${pageId}-heading`}>
        <div className="legal-hero__grid-bg" aria-hidden />
        <div className="legal-hero__mesh" aria-hidden />
        <div className="legal-hero__orb legal-hero__orb--a" aria-hidden />
        <div className="legal-hero__orb legal-hero__orb--b" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-4">
          <span className="legal-hero__eyebrow">
            <EyebrowIcon className="h-3.5 w-3.5" aria-hidden />
            {eyebrow}
          </span>

          <h1 id={`${pageId}-heading`} className="legal-hero__title">
            {title}
          </h1>

          <p className="legal-hero__lead">{lead}</p>

          <div className="legal-hero__meta">
            <span className="legal-hero__pill">Last updated: {lastUpdated}</span>
            <span className="legal-hero__pill">{sectionCountLabel}</span>
          </div>
        </div>
      </section>

      <div className="legal-body">
        <div className="legal-body__inner">
          <aside className="legal-toc" aria-label="Page sections">
            <p className="legal-toc__title">On this page</p>
            <nav className="legal-toc__list">
              {sections.map((section) => (
                <a key={section.id} href={`#${section.id}`} className="legal-toc__link">
                  <span className="legal-toc__num">{section.number}.</span>
                  <span>{section.title}</span>
                </a>
              ))}
            </nav>
          </aside>

          <div>
            <div className="legal-sections">
              {sections.map((section, index) => {
                const Icon = sectionIcons[section.id] ?? DefaultIcon;

                return (
                  <motion.article
                    key={section.id}
                    id={section.id}
                    className="legal-card"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-40px' }}
                    custom={index}
                    variants={fadeUp}
                  >
                    <div className="legal-card__accent" aria-hidden />
                    <div className="legal-card__icon-wrap" aria-hidden>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="legal-card__content">
                      <div className="legal-card__head">
                        <span className="legal-card__num">{section.number}</span>
                        <h2 className="legal-card__title">{section.title}</h2>
                      </div>

                      {section.body ? <p className="legal-card__body">{section.body}</p> : null}

                      {section.bullets?.length ? (
                        <ul className="legal-card__list">
                          {section.bullets.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : null}

                      {section.contact ? (
                        <div className="legal-card__contact">
                          <a href={`mailto:${section.contact.email}`} className="legal-card__contact-item">
                            <span className="legal-card__contact-label">Email</span>
                            <span>{section.contact.email}</span>
                          </a>
                          <a href={`tel:${section.contact.phoneTel}`} className="legal-card__contact-item">
                            <span className="legal-card__contact-label">Phone</span>
                            <span>{section.contact.phone}</span>
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </motion.article>
                );
              })}
            </div>

            {closing ? (
              <motion.div
                className="legal-closing"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                custom={sections.length}
                variants={fadeUp}
              >
                <p className="legal-closing__label">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  {closing.label}
                </p>
                <p className="legal-closing__text">{closing.text}</p>
              </motion.div>
            ) : null}

            <div className="legal-footer">
              <div className="legal-related" aria-label="Related legal pages">
                {relatedLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="legal-related__card">
                    {link.label}
                  </Link>
                ))}
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
