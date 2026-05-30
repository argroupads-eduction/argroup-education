'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  BookOpen,
  Globe2,
  GraduationCap,
  HeartHandshake,
  MapPin,
  MessageCircle,
  Plane,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  ABOUT_COMMITMENTS,
  ABOUT_DIFFERENTIATORS,
  ABOUT_ESTABLISHED,
  ABOUT_HERO_LEAD,
  ABOUT_HIGHLIGHTS,
  ABOUT_MISSION,
  ABOUT_PROCESS,
  ABOUT_STATS,
  ABOUT_STORY,
  ABOUT_TIMELINE,
  ABOUT_TRUST_PILLARS,
  ABOUT_VISION,
} from '@/lib/aboutContent';
import { MBBS_ABROAD_COUNTRIES } from '@/lib/mbbsAbroadTree';
import '@/styles/about-page.css';

const HIGHLIGHT_ICONS: Record<string, LucideIcon> = {
  'mbbs-abroad': Globe2,
  'mbbs-india': MapPin,
  'md-ms': Stethoscope,
  universities: GraduationCap,
  visa: Plane,
  support: HeartHandshake,
  career: BookOpen,
  stories: Award,
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  viewport: { once: true, margin: '-60px' },
};

const yearsExperience = new Date().getFullYear() - ABOUT_ESTABLISHED;

export function AboutPageView() {
  const countryPills = [...MBBS_ABROAD_COUNTRIES, ...MBBS_ABROAD_COUNTRIES];

  return (
    <div className="about-page">
      {/* Hero */}
      <section className="about-hero" aria-labelledby="about-hero-heading">
        <div className="about-hero__grid-bg" aria-hidden />
        <div className="about-hero__orb about-hero__orb--a" aria-hidden />
        <div className="about-hero__orb about-hero__orb--b" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-4">
          <span className="about-hero__eyebrow">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {ABOUT_STORY.kicker}
          </span>

          <h1 id="about-hero-heading" className="about-hero__title">
            Your medical education
            <br />
            <em>journey starts with clarity</em>
          </h1>

          <p className="about-hero__lead">{ABOUT_HERO_LEAD}</p>

          <dl className="about-hero__stats">
            {ABOUT_STATS.map((stat) => (
              <div key={stat.label} className="about-hero__stat">
                <span className="about-hero__stat-shine" aria-hidden />
                <dt className="about-hero__stat-label">{stat.label}</dt>
                <dd className="about-hero__stat-value">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Story + vision / mission */}
      <section className="about-section">
        <div className="mx-auto max-w-7xl px-4">
          <div className="about-story-grid">
            <motion.div className="about-story-visual" {...fadeUp}>
              <div className="about-story-frame">
                <Image
                  src="/about-counsellor.png"
                  alt="AR Group of Education — medical admission counselling team"
                  width={560}
                  height={700}
                  sizes="(max-width: 1024px) 100vw, 560px"
                  className="w-full"
                  priority
                />
              </div>
              <div className="about-story-badge about-story-badge--year">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-600">Since</p>
                <p className="text-3xl font-black text-navy-900">{ABOUT_ESTABLISHED}</p>
                <p className="text-xs text-slate-600">{yearsExperience}+ years</p>
              </div>
              <div className="about-story-badge about-story-badge--students flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500 text-white">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-lg font-bold text-navy-900">4000+</p>
                  <p className="text-xs text-slate-600">Students guided</p>
                </div>
              </div>
            </motion.div>

            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
              <p className="about-kicker">{ABOUT_STORY.kicker}</p>
              <h2 className="about-heading">{ABOUT_STORY.title}</h2>
              {ABOUT_STORY.paragraphs.map((p) => (
                <p key={p.slice(0, 40)} className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                  {p}
                </p>
              ))}

              <div className="about-mv-grid">
                <article className="about-mv-card">
                  <h3>{ABOUT_VISION.title}</h3>
                  <p>{ABOUT_VISION.text}</p>
                </article>
                <article className="about-mv-card">
                  <h3>{ABOUT_MISSION.title}</h3>
                  <p>{ABOUT_MISSION.text}</p>
                </article>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Highlights bento */}
      <section className="about-section about-section--soft">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div className="max-w-2xl" {...fadeUp}>
            <p className="about-kicker">Why AR Group</p>
            <h2 className="about-heading">Built for medical aspirants — not generic study abroad</h2>
            <p className="mt-3 text-slate-600">
              Every service is designed around NEET, medical licensing, and real admission timelines — India and
              abroad under one trusted roof.
            </p>
          </motion.div>

          <div className="about-bento">
            {ABOUT_HIGHLIGHTS.map((item, i) => {
              const Icon = HIGHLIGHT_ICONS[item.id] ?? Sparkles;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.05 }}
                  viewport={{ once: true, margin: '-40px' }}
                >
                  <Link href={item.href} className="about-bento-card group block h-full">
                    <span className="about-bento-icon">
                      <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </span>
                    <p className="about-bento-title">{item.title}</p>
                    <p className="about-bento-text">{item.text}</p>
                    <span className="about-bento-link inline-flex items-center gap-1">
                      Learn more
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline + journey showcase */}
      <section className="about-section">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div {...fadeUp}>
            <p className="about-kicker">Our journey</p>
            <h2 className="about-heading">Two decades of student-first counselling</h2>
          </motion.div>

          <div className="about-timeline-grid">
            <div className="about-timeline">
              {ABOUT_TIMELINE.map((item, i) => (
                <motion.article
                  key={item.year}
                  className="about-timeline-item"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.06 }}
                  viewport={{ once: true }}
                >
                  <span className="about-timeline-dot" aria-hidden />
                  <p className="about-timeline-year">{item.year}</p>
                  <h3 className="about-timeline-title">{item.title}</h3>
                  <p className="about-timeline-text">{item.text}</p>
                </motion.article>
              ))}
            </div>

            <motion.aside
              className="about-journey-showcase"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
              viewport={{ once: true, margin: '-40px' }}
              aria-label="AR Group milestones at a glance"
            >
              <div className="about-journey-showcase__mesh" aria-hidden />
              <div className="about-journey-showcase__ring" aria-hidden>
                <svg viewBox="0 0 200 200" className="h-full w-full">
                  <circle
                    cx="100"
                    cy="100"
                    r="88"
                    fill="none"
                    stroke="rgb(255 255 255 / 0.12)"
                    strokeWidth="1"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="88"
                    fill="none"
                    stroke="url(#aboutRingGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="420"
                    strokeDashoffset="90"
                    className="about-journey-showcase__arc"
                  />
                  <defs>
                    <linearGradient id="aboutRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="about-journey-showcase__core">
                  <p className="about-journey-showcase__core-label">Since</p>
                  <p className="about-journey-showcase__core-year">{ABOUT_ESTABLISHED}</p>
                  <p className="about-journey-showcase__core-sub">{yearsExperience}+ yrs</p>
                </div>
              </div>

              <div className="about-journey-showcase__stats">
                {ABOUT_TRUST_PILLARS.map((pillar) => (
                  <div key={pillar.label} className="about-journey-showcase__stat">
                    <strong>{pillar.value}</strong>
                    <span>{pillar.label}</span>
                    <em>{pillar.detail}</em>
                  </div>
                ))}
              </div>

              <div className="about-journey-showcase__orbit" aria-hidden>
                {['NEET', 'NMC', 'WHO', 'Visa', 'India', 'Abroad'].map((tag, i) => (
                  <span
                    key={tag}
                    className="about-journey-showcase__orbit-chip"
                    style={{ ['--orbit-i' as string]: i }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="about-journey-showcase__quote">
                &ldquo;Every milestone on the left reflects real families we&apos;ve walked with — not
                marketing numbers on a slide.&rdquo;
              </p>
            </motion.aside>
          </div>
        </div>
      </section>

      {/* Our commitments — custom trust block (replaces WP export accordion) */}
      <section className="about-section about-section--soft">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div className="max-w-2xl" {...fadeUp}>
            <p className="about-kicker">Our promise</p>
            <h2 className="about-heading">What you can expect from day one</h2>
            <p className="mt-3 text-slate-600">
              No generic study-abroad pitch — just clear, medical-focused counselling built on
              transparency and accountability.
            </p>
          </motion.div>

          <div className="about-commitments-grid">
            {ABOUT_COMMITMENTS.map((item, i) => (
              <motion.article
                key={item.id}
                className="about-commitment-card"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                viewport={{ once: true }}
              >
                <span className="about-commitment-icon" aria-hidden>
                  <ShieldCheck className="h-5 w-5" strokeWidth={2} />
                </span>
                <h3 className="about-commitment-title">{item.title}</h3>
                <p className="about-commitment-text">{item.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="about-section about-section--soft">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div {...fadeUp}>
            <p className="about-kicker">How it works</p>
            <h2 className="about-heading">From first call to campus — five clear steps</h2>
          </motion.div>

          <div className="about-process-rail">
            {ABOUT_PROCESS.map((step, i) => (
              <motion.div
                key={step.step}
                className="about-process-step"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                viewport={{ once: true }}
              >
                <p className="about-process-num">{step.step}</p>
                <h3 className="about-process-title">{step.title}</h3>
                <p className="about-process-text">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Global reach */}
      <section className="about-section">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div className="text-center" {...fadeUp}>
            <p className="about-kicker">Global reach</p>
            <h2 className="about-heading">MBBS abroad destinations we guide</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              Explore country hubs with fees, eligibility, and university lists — same structure as our live guides.
            </p>
          </motion.div>

          <div className="about-countries-wrap">
            <div className="about-countries-track">
              {countryPills.map((country, i) => (
                <Link
                  key={`${country.id}-${i}`}
                  href={country.href}
                  className="about-country-pill"
                >
                  MBBS in {country.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why families choose us */}
      <section className="about-section about-section--soft pb-4 md:pb-6">
        <div className="mx-auto max-w-7xl px-4">
          <div className="about-differentiators">
            <motion.div className="about-differentiators__copy" {...fadeUp}>
              <p className="about-kicker">Why AR Group</p>
              <h2 className="about-heading">Built differently from typical agents</h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Families come to us when brochures and WhatsApp forwards stop making sense. We replace
                noise with a structured plan — India, abroad, or PG — under one accountable team.
              </p>
              <Link
                href="/contact"
                className="about-differentiators__link mt-6 inline-flex items-center gap-2 text-sm font-bold text-gold-700 hover:text-gold-800"
              >
                Talk to a counsellor
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <div className="about-differentiators__list">
              {ABOUT_DIFFERENTIATORS.map((item, i) => (
                <motion.article
                  key={item.title}
                  className="about-differentiator-card"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  viewport={{ once: true }}
                >
                  <span className="about-differentiator-num">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="about-differentiator-title">{item.title}</h3>
                    <p className="about-differentiator-text">{item.text}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-section pb-16 md:pb-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="about-cta">
            <div className="about-cta__mesh" aria-hidden />
            <h2 className="about-cta__title">Ready for honest medical admission guidance?</h2>
            <p className="about-cta__desc">
              Book a free counselling session — no pressure, no hidden fees. Talk to AR Group before you commit to a
              college or country.
            </p>
            <div className="about-cta__actions">
              <Link href="/contact">
                <Button variant="primary" size="lg" className="group">
                  Free counselling
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/25 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
