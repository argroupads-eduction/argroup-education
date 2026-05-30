'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Award,
  CheckCircle2,
  GraduationCap,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

const ESTABLISHED_YEAR = 2005
const YEARS_EXPERIENCE = new Date().getFullYear() - ESTABLISHED_YEAR

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: 'WHO & NMC aligned guidance',
    text: 'Shortlisted universities that meet Indian medical council norms.',
  },
  {
    icon: GraduationCap,
    title: 'India + Abroad pathways',
    text: 'MBBS in India, MBBS abroad, and MD/MS counselling under one roof.',
  },
  {
    icon: Award,
    title: 'Transparent admissions',
    text: 'No hidden capitation — clear fees, documentation, and visa support.',
  },
] as const

const PROMISES = [
  'Personalised college shortlisting',
  'NEET & eligibility counselling',
  'Documentation & visa end-to-end',
  'Pre-departure & parent updates',
  'English-medium university options',
  'Alumni & student support network',
] as const

export const AboutSection = () => {
  return (
    <section
      id="about-us"
      className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/80 to-white py-16 md:py-24"
    >
      {/* Soft background accents */}
      <div
        className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-navy-500/8 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Visual column */}
          <motion.div
            className="relative lg:col-span-5"
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
            viewport={{ once: true, margin: '-80px' }}
          >
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Offset frame */}
              <div
                className="absolute -bottom-4 -right-4 hidden h-[88%] w-[88%] rounded-[2rem] border-2 border-gold-400/50 md:block"
                aria-hidden
              />
              <div className="absolute -left-3 -top-3 h-24 w-24 rounded-3xl bg-navy-900/5 md:h-32 md:w-32" aria-hidden />

              <div className="relative overflow-hidden rounded-[2rem] bg-navy-900 shadow-2xl shadow-navy-900/20 ring-1 ring-white/10">
                <div className="absolute inset-0 bg-gradient-to-tr from-navy-900/40 via-transparent to-gold-500/10 z-[1]" />
                <Image
                  src="/about-counsellor.png"
                  alt="AR Group of Education counsellor — trusted MBBS admission guidance"
                  width={560}
                  height={700}
                  sizes="(max-width: 1024px) 100vw, 560px"
                  className="aspect-[4/5] w-full object-cover object-top"
                />
              </div>

              {/* Established badge */}
              <motion.div
                className="absolute -right-2 top-6 z-10 rounded-2xl border border-white/80 bg-white px-4 py-3 shadow-xl md:right-4"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-600">Since</p>
                <p className="text-3xl font-black leading-none text-navy-900">{ESTABLISHED_YEAR}</p>
                <p className="mt-1 text-xs font-medium text-slate-600">{YEARS_EXPERIENCE}+ years of trust</p>
              </motion.div>

              {/* Students badge */}
              <motion.div
                className="absolute -left-2 bottom-8 z-10 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm md:left-4"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500 text-white">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-lg font-bold text-navy-900">4000+</p>
                  <p className="text-xs text-slate-600">Students counselled</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Content column */}
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
            viewport={{ once: true, margin: '-80px' }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-gold-700">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
              About us
            </span>

            <h2 className="mt-5 font-serif text-3xl font-bold leading-tight text-navy-900 md:text-4xl lg:text-[2.65rem]">
              AR Group of Education — guiding{' '}
              <span className="bg-gradient-to-r from-gold-500 to-gold-600 bg-clip-text text-transparent">
                future doctors
              </span>{' '}
              since {ESTABLISHED_YEAR}
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
              For over {YEARS_EXPERIENCE} years, we have helped students and families navigate MBBS admissions
              across India and abroad — from NEET counselling and college selection to documentation, visas,
              and pre-departure support. Our team combines medical education expertise with honest, student-first
              advice at every step.
            </p>

            {/* Highlight cards */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {HIGHLIGHTS.map((item, i) => (
                <motion.div
                  key={item.title}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-gold-300/60 hover:shadow-md"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.45 }}
                  viewport={{ once: true }}
                >
                  <item.icon className="h-6 w-6 text-gold-500" strokeWidth={2} />
                  <p className="mt-3 text-sm font-semibold text-navy-900">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.text}</p>
                </motion.div>
              ))}
            </div>

            {/* Promise grid */}
            <div className="mt-8 rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-sm backdrop-blur-sm md:p-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-navy-800">What you get with us</p>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {PROMISES.map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            {/* Timeline strip */}
            <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl bg-navy-900 px-5 py-4 text-white md:gap-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-300">Founded</p>
                <p className="text-xl font-bold">{ESTABLISHED_YEAR}</p>
              </div>
              <div className="hidden h-10 w-px bg-white/20 sm:block" aria-hidden />
              <div className="flex-1 min-w-[12rem]">
                <p className="text-sm text-blue-100/90">
                  From a single counselling desk in 2005 to a full-service medical admission partner for India
                  and global universities — built on results, not promises.
                </p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-2 text-center">
                <p className="text-2xl font-black text-gold-400">{YEARS_EXPERIENCE}+</p>
                <p className="text-[10px] uppercase tracking-wider text-blue-100">Years</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/contact">
                <Button variant="primary" size="lg" className="group w-full sm:w-auto">
                  Schedule free counselling
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-navy-900/15 bg-white px-8 py-4 text-base font-semibold text-navy-900 transition hover:border-gold-400 hover:bg-gold-50 sm:w-auto"
              >
                <MessageCircle className="h-5 w-5 text-green-600" />
                Chat on WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
