'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  Building2,
  ClipboardList,
  FileCheck,
  Globe2,
  GraduationCap,
  MessageCircle,
  Phone,
  Plane,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CONTACT_INFO } from '@/lib/constants';
import {
  SERVICES_FLAGSHIP,
  SERVICES_HERO_LEAD,
  SERVICES_PROCESS,
  SERVICES_PROMISES,
  SERVICES_STATS,
  SERVICES_SUPPORT,
} from '@/lib/servicesContent';
import '@/styles/services-page.css';

const FLAGSHIP_ICONS: Record<string, LucideIcon> = {
  'mbbs-india': GraduationCap,
  'mbbs-abroad': Globe2,
  'md-ms': Stethoscope,
  'neet-predictor': Target,
};

const SUPPORT_ICONS: Record<string, LucideIcon> = {
  counselling: Users,
  shortlisting: Building2,
  admission: ClipboardList,
  documentation: FileCheck,
  visa: ShieldCheck,
  scholarship: Award,
  bams: Stethoscope,
  predeparture: Plane,
};

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.48, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function ServicesPageView() {
  return (
    <div className="services-page">
      <section className="services-hero" aria-labelledby="services-hero-heading">
        <div className="services-hero__grid-bg" aria-hidden />
        <div className="services-hero__mesh" aria-hidden />
        <div className="services-hero__orb services-hero__orb--a" aria-hidden />
        <div className="services-hero__orb services-hero__orb--b" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-4">
          <span className="services-hero__eyebrow">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Medical admission specialists
          </span>

          <h1 id="services-hero-heading" className="services-hero__title">
            Services built for your <em>medical journey</em>
          </h1>

          <p className="services-hero__lead">{SERVICES_HERO_LEAD}</p>

          <ul className="services-hero__stats" aria-label="Key outcomes">
            {SERVICES_STATS.map((stat) => (
              <li key={stat.label} className="services-hero__stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="services-section" aria-labelledby="services-flagship-heading">
        <div className="services-section__inner">
          <div className="services-section__head">
            <p className="services-section__label">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden />
              Core programmes
            </p>
            <h2 id="services-flagship-heading" className="services-section__title">
              Flagship counselling services
            </h2>
            <p className="services-section__desc">
              India, abroad, and postgraduate pathways, each with dedicated counsellors and verified
              university networks.
            </p>
          </div>

          <div className="services-bento">
            {SERVICES_FLAGSHIP.map((service, index) => {
              const Icon = FLAGSHIP_ICONS[service.id] ?? GraduationCap;

              return (
                <motion.article
                  key={service.id}
                  className={`services-flagship services-flagship--${service.accent} ${
                    service.featured ? 'services-flagship--featured' : 'services-flagship--compact'
                  }`}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-40px' }}
                  custom={index}
                  variants={fadeUp}
                >
                  <div className="services-flagship__glow" aria-hidden />
                  <div className="services-flagship__icon" aria-hidden>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="services-flagship__tag">{service.tagline}</p>
                  <h3 className="services-flagship__title">{service.title}</h3>
                  <p className="services-flagship__body">{service.description}</p>
                  <ul className="services-flagship__list">
                    {service.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <Link href={service.href} className="services-flagship__link">
                    Explore {service.title}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="services-section" aria-labelledby="services-support-heading">
        <div className="services-section__inner">
          <div className="services-section__head">
            <p className="services-section__label">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              End-to-end support
            </p>
            <h2 id="services-support-heading" className="services-section__title">
              Everything beyond the application
            </h2>
            <p className="services-section__desc">
              Practical help at every stage, counselling, documents, visas, scholarships, and
              pre-departure coordination.
            </p>
          </div>

          <div className="services-support-grid">
            {SERVICES_SUPPORT.map((service, index) => {
              const Icon = SUPPORT_ICONS[service.id] ?? FileCheck;

              return (
                <motion.div
                  key={service.id}
                  className="services-support-card"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-30px' }}
                  custom={index}
                  variants={fadeUp}
                >
                  <div className="services-support-card__icon" aria-hidden>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="services-support-card__title">{service.title}</h3>
                  <p className="services-support-card__text">{service.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="services-section" aria-labelledby="services-process-heading">
        <div className="services-section__inner">
          <div className="services-section__head">
            <p className="services-section__label">How it works</p>
            <h2 id="services-process-heading" className="services-section__title">
              Your admission roadmap
            </h2>
            <p className="services-section__desc">
              A clear five-step process used across MBBS India, MBBS abroad, and MD/MS counselling.
            </p>
          </div>

          <div className="services-process">
            {SERVICES_PROCESS.map((step, index) => (
              <motion.div
                key={step.step}
                className="services-process__step"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-30px' }}
                custom={index}
                variants={fadeUp}
              >
                <span className="services-process__num">{step.step}</span>
                <h3 className="services-process__title">{step.title}</h3>
                <p className="services-process__text">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="services-section" aria-labelledby="services-promises-heading">
        <div className="services-section__inner">
          <div className="services-section__head">
            <p className="services-section__label">Our promise</p>
            <h2 id="services-promises-heading" className="services-section__title">
              Why families trust AR Group
            </h2>
          </div>

          <div className="services-promises">
            {SERVICES_PROMISES.map((item, index) => (
              <motion.div
                key={item.id}
                className="services-promise"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-30px' }}
                custom={index}
                variants={fadeUp}
              >
                <h3 className="services-promise__title">{item.title}</h3>
                <p className="services-promise__text">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="services-cta" aria-labelledby="services-cta-heading">
        <div className="services-cta__mesh" aria-hidden />
        <div className="services-cta__inner">
          <div>
            <h2 id="services-cta-heading" className="services-cta__title">
              Ready to start with expert counselling?
            </h2>
            <p className="services-cta__desc">
              Book a free session, call our 24×7 desk, or message us on WhatsApp. No pressure, no
              hidden fees, just honest medical admission guidance.
            </p>
          </div>
          <div className="services-cta__actions">
            <Link href="/contact" className="services-cta__chip services-cta__chip--primary">
              Book expert counselling
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a href={`tel:${CONTACT_INFO.phoneTel}`} className="services-cta__chip">
              <Phone className="h-4 w-4" aria-hidden />
              {CONTACT_INFO.phone}
            </a>
            <a
              href={CONTACT_INFO.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="services-cta__chip"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
