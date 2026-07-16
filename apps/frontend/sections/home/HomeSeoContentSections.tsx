'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, HeartHandshake, Stethoscope } from 'lucide-react';
import { HOME_DIFFERENTIATORS, HOME_INTERNAL_PATHS, HOME_PAGE_H1 } from '@/lib/homePageSeoContent';

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  viewport: { once: true, margin: '-80px' as const },
};

function HeroBodyLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="!text-inherit font-normal underline decoration-white/35 underline-offset-[3px] transition-[text-decoration-color] hover:!text-inherit hover:decoration-white/65 focus-visible:!text-inherit"
    >
      {children}
    </Link>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <span className="h-px w-10 bg-gradient-to-r from-gold-500 to-transparent" aria-hidden />
      <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-gold-800">{children}</p>
    </div>
  );
}

const editorialBodyText =
  'space-y-4 text-left [&_p]:text-[14px] [&_p]:font-normal [&_p]:leading-[1.75] md:[&_p]:text-[15px] md:[&_p]:leading-[1.8]';

export function HomeSeoContentSections() {
  return (
    <div className="home-editorial relative overflow-hidden bg-[#f4f6fa]">
      {/* —— HERO —— */}
      <section className="relative min-h-[520px] overflow-hidden md:min-h-[580px]">
        <div className="absolute inset-0 bg-[#051219]" aria-hidden />
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(ellipse 120% 80% at 0% 100%, rgba(255,167,38,0.14), transparent 50%), radial-gradient(ellipse 60% 50% at 100% 0%, rgba(56,189,248,0.08), transparent 45%), linear-gradient(135deg, #051219 0%, #0a1b29 45%, #142d4c 100%)',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full border border-gold-500/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-12 top-1/3 h-48 w-48 rounded-full border border-white/5"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-gold-500/[0.07] blur-3xl"
          aria-hidden
        />

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,167,38,0.35) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-12 lg:gap-12 lg:px-6 lg:py-18 xl:gap-14">
          <motion.div {...reveal} className="relative lg:col-span-5">
            <div
              className="absolute -bottom-4 -right-4 hidden h-[88%] w-[88%] rounded-[2rem] border-2 border-gold-400/40 md:block"
              aria-hidden
            />
            <div className="relative overflow-hidden rounded-[2rem] bg-navy-900 shadow-2xl shadow-navy-900/30 ring-1 ring-white/10 ring-offset-2 ring-offset-[#051219]">
              <div className="absolute inset-0 z-[1] bg-gradient-to-tr from-navy-900/40 via-transparent to-gold-500/20" aria-hidden />
              <Image
                src="/medical-admission-counselling-hero.png"
                alt="Medical admission counsellor guiding a student for MBBS in India and abroad"
                width={560}
                height={640}
                sizes="(max-width: 1024px) 100vw, 560px"
                className="aspect-[4/5] w-full object-cover object-center"
                loading="lazy"
              />
            </div>
          </motion.div>

          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.1 }}
            className="flex flex-col lg:col-span-7"
          >
            <div className="max-w-2xl border-l-2 border-gold-500/80 pl-5 md:pl-6">
              <h1 className="text-[1.65rem] font-bold leading-[1.3] tracking-tight text-white sm:text-[1.85rem] md:text-[2rem] lg:text-[2.15rem] lg:leading-[1.32]">
                {HOME_PAGE_H1}
              </h1>
            </div>
            <div className="relative mt-7 lg:mt-8">
              <div
                className="absolute -inset-px rounded-[1.3rem] bg-gradient-to-br from-gold-500/50 via-gold-500/10 to-transparent opacity-70"
                aria-hidden
              />
              <div className="relative rounded-[1.25rem] border border-white/15 bg-navy-950/55 p-5 text-white shadow-[0_20px_60px_-24px_rgba(0,0,0,0.55)] backdrop-blur-xl md:p-7">
                <div className="mb-4 flex items-center gap-2" aria-hidden>
                  <span className="h-px flex-1 max-w-[3rem] bg-gradient-to-r from-gold-400/80 to-transparent" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold-300">
                    Your admission partner
                  </span>
                </div>
                <div className={`${editorialBodyText} [&_a]:!text-inherit [&_a:hover]:!text-inherit [&_p]:!text-white/95`}>
                  <p>
                    Becoming a doctor is a dream shared by thousands of students across India. However,
                    with increasing competition, limited medical seats, and complex admission procedures,
                    securing admission to the right medical college requires more than just academic
                    excellence. Students need expert guidance, strategic planning, and accurate information
                    to make informed decisions about their medical careers.
                  </p>
                  <p>
                    This is where professional Medical Admission Guidance, trusted{' '}
                    <HeroBodyLink href={HOME_INTERNAL_PATHS.mbbsAdmissionConsultancy}>
                      MBBS Admission Consultancy
                    </HeroBodyLink>
                    , expert Admission Counselling for Medical Students, and reliable Medical
                    College Admission Assistance become essential. Whether you want to pursue{' '}
                    <HeroBodyLink href={HOME_INTERNAL_PATHS.studyMbbsInIndia}>MBBS in India</HeroBodyLink>
                    {' '}or explore global opportunities through MBBS Abroad Consultancy, the right support can
                    help you achieve your career goals with confidence.
                  </p>
                  <p>
                    At AR Group of Education, we have been helping aspiring doctors secure admissions in
                    leading medical colleges across India and abroad for over 21 years. Our mission is to
                    provide transparent counseling, personalized support, and complete admission assistance
                    that empowers students to make the best choices for their future.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* —— GUIDANCE + COUNSELLING —— */}
      <section id="medical-admission-guidance" className="relative bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionEyebrow>Expert guidance</SectionEyebrow>
          <div className="grid gap-8 lg:grid-cols-2">
            <motion.article
              {...reveal}
              className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-8 shadow-[0_20px_60px_-30px_rgba(26,54,93,0.15)] md:p-10"
            >
              <div className="mb-5 inline-flex rounded-2xl bg-navy-900 p-3.5 text-gold-400 shadow-lg shadow-navy-900/20">
                <Stethoscope className="h-6 w-6" aria-hidden />
              </div>
              <h2 className="text-2xl font-bold text-navy-900 md:text-3xl">
                Why Professional Medical Admission Guidance Matters
              </h2>
              <div className={`mt-5 ${editorialBodyText} [&_p]:text-slate-600`}>
                <p>
                  Medical admissions have become increasingly competitive due to rising numbers of applicants
                  and limited seats. Professional Medical Admission Guidance helps students understand
                  admission procedures, evaluate available opportunities, and develop effective admission
                  strategies.
                </p>
                <p>
                  Every student has different academic strengths, NEET scores, financial considerations, and
                  career goals. Through personalized counseling sessions, we analyze these factors and provide
                  customized recommendations that align with each student&apos;s aspirations.
                </p>
                <p>
                  Our specialized Admission Guidance for NEET Aspirants helps students understand counseling
                  rounds, cutoff trends, seat allocation processes, and admission opportunities. With proper
                  planning and expert support, students can significantly improve their chances of securing
                  admission to reputed medical institutions.
                </p>
              </div>
            </motion.article>

            <motion.article
              {...reveal}
              className="rounded-3xl border border-gold-200/60 bg-gradient-to-br from-gold-50/80 via-white to-white p-8 shadow-[0_20px_60px_-30px_rgba(255,167,38,0.2)] md:p-10"
            >
              <div className="mb-5 inline-flex rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 p-3.5 text-white shadow-lg shadow-gold-500/25">
                <HeartHandshake className="h-6 w-6" aria-hidden />
              </div>
              <h2 className="text-2xl font-bold text-navy-900 md:text-3xl">
                Admission Counselling for Medical Students
              </h2>
              <div className={`mt-5 ${editorialBodyText} [&_p]:text-slate-600`}>
                <p>
                  Choosing the right medical college is one of the most important decisions in a student&apos;s
                  life. Our comprehensive Admission Counselling for Medical Students is designed to simplify
                  this process and help students make informed decisions.
                </p>
                <p>
                  We assist students in understanding college rankings, accreditation, fee structures,
                  infrastructure, clinical exposure, and future career opportunities. Through personalized
                  counseling, students receive accurate information that helps them select institutions that
                  best match their academic goals and financial capabilities.
                </p>
                <p>
                  Our experienced counselors provide Admission Counselling for Medical Students seeking
                  admission to government medical colleges, private medical colleges, deemed universities,
                  and international medical institutions.
                </p>
              </div>
            </motion.article>
          </div>
        </div>
      </section>

      {/* —— DIFFERENTIATORS —— */}
      <section id="what-makes-us-different" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionEyebrow>Why AR Group</SectionEyebrow>
          <motion.h2 {...reveal} className="text-2xl font-bold text-navy-900 md:text-3xl">
            What Makes Us Different?
          </motion.h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {HOME_DIFFERENTIATORS.map((item) => (
              <motion.li
                key={item}
                {...reveal}
                className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-gold-300/50 hover:shadow-md"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-500" aria-hidden />
                <span className="text-slate-700 leading-snug">{item}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
