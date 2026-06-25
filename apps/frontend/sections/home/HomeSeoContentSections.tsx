'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import {
  HOME_ABROAD_DESTINATIONS,
  HOME_ADMISSION_ASSISTANCE_STEPS,
  HOME_AR_SERVICES,
  HOME_CONSULTANCY_BENEFITS,
  HOME_DIFFERENTIATORS,
  HOME_INTERNAL_PATHS,
  HOME_PAGE_H1,
} from '@/lib/homePageSeoContent';
import { CONTACT_INFO } from '@/lib/constants';

function SeoLink({
  href,
  children,
  light = false,
}: {
  href: string;
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        light
          ? 'font-semibold text-gold-300 underline decoration-gold-400/50 underline-offset-[3px] transition-colors hover:text-gold-200'
          : 'font-semibold text-gold-600 underline decoration-gold-500/35 underline-offset-[3px] transition-colors hover:text-gold-700'
      }
    >
      {children}
    </Link>
  );
}

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  viewport: { once: true, margin: '-80px' as const },
};

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <span className="h-px w-10 bg-gradient-to-r from-gold-500 to-transparent" aria-hidden />
      <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-gold-600">{children}</p>
    </div>
  );
}

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
        {/* decorative rings */}
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

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 lg:grid-cols-12 lg:gap-16 lg:px-6 lg:py-20">
          <motion.div {...reveal} className="lg:col-span-6 xl:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-gold-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-gold-200">
              <Sparkles className="h-3.5 w-3.5 text-gold-400" aria-hidden />
              Trusted since 2005
            </span>
            <div className="mt-8 border-l-[3px] border-gold-500 pl-6 md:pl-8">
              <h1 className="text-balance text-3xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-4xl md:text-[2.75rem] lg:text-[3.1rem]">
                {HOME_PAGE_H1}
              </h1>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 backdrop-blur-sm">
                21+ years expertise
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 backdrop-blur-sm">
                India &amp; Abroad admissions
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 backdrop-blur-sm">
                NEET counselling support
              </span>
            </div>
          </motion.div>

          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.1 }}
            className="lg:col-span-6 xl:col-span-7"
          >
            <div className="relative">
              <div
                className="absolute -inset-1 rounded-[1.35rem] bg-gradient-to-br from-gold-500/40 via-transparent to-sky-400/20 opacity-60 blur-sm"
                aria-hidden
              />
              <div className="relative rounded-[1.25rem] border border-white/12 bg-white/[0.07] p-6 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)] backdrop-blur-xl md:p-9">
                <div className="space-y-5 text-[15px] leading-[1.8] text-slate-100/95 md:text-base">
                  <p>
                    Becoming a doctor is a dream shared by thousands of students across India. However,
                    with increasing competition, limited medical seats, and complex admission procedures,
                    securing admission to the right medical college requires more than just academic
                    excellence. Students need expert guidance, strategic planning, and accurate information
                    to make informed decisions about their medical careers.
                  </p>
                  <p>
                    This is where professional{' '}
                    <SeoLink href={HOME_INTERNAL_PATHS.medicalAdmissionGuidance} light>
                      Medical Admission Guidance
                    </SeoLink>
                    , trusted{' '}
                    <SeoLink href={HOME_INTERNAL_PATHS.mbbsAdmissionConsultancy} light>
                      MBBS Admission Consultancy
                    </SeoLink>
                    , expert{' '}
                    <SeoLink href={HOME_INTERNAL_PATHS.admissionCounselling} light>
                      Admission Counselling for Medical Students
                    </SeoLink>
                    , and reliable{' '}
                    <SeoLink href={HOME_INTERNAL_PATHS.medicalCollegeAdmissionAssistance} light>
                      Medical College Admission Assistance
                    </SeoLink>{' '}
                    become essential. Whether you want to pursue MBBS in India or explore global opportunities
                    through{' '}
                    <SeoLink href={HOME_INTERNAL_PATHS.mbbsAbroadConsultancy} light>
                      MBBS Abroad Consultancy
                    </SeoLink>
                    , the right support can help you achieve your career goals with confidence.
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
              <div className="mt-5 space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Medical admissions have become increasingly competitive due to rising numbers of applicants
                  and limited seats. Professional{' '}
                  <SeoLink href={HOME_INTERNAL_PATHS.medicalAdmissionGuidance}>Medical Admission Guidance</SeoLink>{' '}
                  helps students understand admission procedures, evaluate available opportunities, and develop
                  effective admission strategies.
                </p>
                <p>
                  Every student has different academic strengths, NEET scores, financial considerations, and
                  career goals. Through personalized counseling sessions, we analyze these factors and provide
                  customized recommendations that align with each student&apos;s aspirations.
                </p>
                <p>
                  Our specialized{' '}
                  <SeoLink href={HOME_INTERNAL_PATHS.neetAspirantsGuidance}>
                    Admission Guidance for NEET Aspirants
                  </SeoLink>{' '}
                  helps students understand counseling rounds, cutoff trends, seat allocation processes, and
                  admission opportunities. With proper planning and expert support, students can significantly
                  improve their chances of securing admission to reputed medical institutions.
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
              <div className="mt-5 space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Choosing the right medical college is one of the most important decisions in a student&apos;s
                  life. Our comprehensive{' '}
                  <SeoLink href={HOME_INTERNAL_PATHS.admissionCounselling}>
                    Admission Counselling for Medical Students
                  </SeoLink>{' '}
                  is designed to simplify this process and help students make informed decisions.
                </p>
                <p>
                  We assist students in understanding college rankings, accreditation, fee structures,
                  infrastructure, clinical exposure, and future career opportunities. Through personalized
                  counseling, students receive accurate information that helps them select institutions that
                  best match their academic goals and financial capabilities.
                </p>
                <p>
                  Our experienced counselors provide{' '}
                  <SeoLink href={HOME_INTERNAL_PATHS.admissionCounselling}>
                    Admission Counselling for Medical Students
                  </SeoLink>{' '}
                  seeking admission to government medical colleges, private medical colleges, deemed
                  universities, and international medical institutions.
                </p>
              </div>
            </motion.article>
          </div>
        </div>
      </section>

      {/* —— PROCESS + BENEFITS —— */}
      <section id="mbbs-admission-consultancy" className="bg-navy-900 py-16 text-white md:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionEyebrow>
            <span className="text-gold-400">End-to-end support</span>
          </SectionEyebrow>
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
            <motion.div {...reveal}>
              <h2 className="text-2xl font-bold md:text-3xl">
                Medical College Admission Assistance from Start to Finish
              </h2>
              <p className="mt-4 text-slate-300 leading-relaxed">
                The admission process involves multiple stages, including college selection, application
                submission, counseling registration, document verification, and final admission
                confirmation. Our professional{' '}
                <SeoLink href={HOME_INTERNAL_PATHS.medicalCollegeAdmissionAssistance} light>
                  Medical College Admission Assistance
                </SeoLink>{' '}
                ensures that students receive support at every stage of this journey.
              </p>
              <ul className="mt-8 space-y-4">
                {HOME_ADMISSION_ASSISTANCE_STEPS.map((step) => (
                  <li key={step} className="flex gap-4">
                    <span
                      className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gold-400 ring-4 ring-gold-400/20"
                      aria-hidden
                    />
                    <span className="text-slate-200 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-slate-400 leading-relaxed">
                Our end-to-end{' '}
                <SeoLink href={HOME_INTERNAL_PATHS.medicalCollegeAdmissionAssistance} light>
                  Medical College Admission Assistance
                </SeoLink>{' '}
                reduces confusion and helps students navigate the admission process with confidence.
              </p>
            </motion.div>
            <motion.div {...reveal}>
              <h2 className="text-2xl font-bold md:text-3xl">
                Benefits of Choosing an MBBS Admission Consultancy
              </h2>
              <p className="mt-4 text-slate-300 leading-relaxed">
                Selecting the right medical college can shape a student&apos;s future career. A trusted{' '}
                <SeoLink href={HOME_INTERNAL_PATHS.mbbsAdmissionConsultancy} light>
                  MBBS Admission Consultancy
                </SeoLink>{' '}
                simplifies the admission process by providing expert guidance and personalized support.
              </p>
              <ul className="mt-8 grid gap-3">
                {HOME_CONSULTANCY_BENEFITS.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-slate-200"
                  >
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-slate-300 leading-relaxed text-sm">
                Students also benefit from professional{' '}
                <SeoLink href={HOME_INTERNAL_PATHS.medicalCollegeAdmissionAssistance} light>
                  Medical College Admission Assistance
                </SeoLink>
                , which helps them compare institutions, understand regulations, and identify the best
                opportunities available.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* —— ABROAD —— */}
      <section id="mbbs-abroad-consultancy" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionEyebrow>Study abroad</SectionEyebrow>
          <motion.div {...reveal} className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-2xl bg-navy-900 p-3.5 text-gold-400">
              <Globe2 className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="text-2xl font-bold text-navy-900 md:text-4xl">
              MBBS Abroad Consultancy for Global Medical Education
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Studying medicine abroad has become an attractive option for students seeking quality education,
              global exposure, and affordable tuition fees. Our professional{' '}
              <SeoLink href={HOME_INTERNAL_PATHS.mbbsAbroadConsultancy}>MBBS Abroad Consultancy</SeoLink>{' '}
              services help students explore internationally recognized medical universities that offer
              excellent academic and clinical training.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HOME_ABROAD_DESTINATIONS.map((country) => (
              <motion.div key={country.name} {...reveal}>
                <Link
                  href={country.href}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/60 hover:shadow-xl hover:shadow-gold-500/10"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900/5 text-navy-900 transition-colors group-hover:bg-gold-500 group-hover:text-white">
                    <Globe2 className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-xl font-bold text-navy-900 group-hover:text-gold-700">
                    {country.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{country.description}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gold-600">
                    Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.p {...reveal} className="mx-auto mt-12 max-w-3xl text-center text-slate-600 leading-relaxed">
            Our <SeoLink href={HOME_INTERNAL_PATHS.mbbsAbroadConsultancy}>MBBS Abroad Consultancy</SeoLink>{' '}
            services include university selection, eligibility assessment, application processing, admission
            confirmation, visa assistance, accommodation support, and pre-departure guidance. By choosing
            our expert to{' '}
            <SeoLink href={HOME_INTERNAL_PATHS.studyMbbsAbroadConsultancy}>
              Study MBBS Abroad Consultancy
            </SeoLink>
            , students can confidently pursue medical education at globally recognized universities while
            receiving complete support throughout their journey.
          </motion.p>
        </div>
      </section>

      {/* —— INDIA —— */}
      <section className="border-y border-slate-200 bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionEyebrow>MBBS in India</SectionEyebrow>
          <div className="grid gap-8 lg:grid-cols-2">
            <motion.article
              {...reveal}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-[#0f2847] p-8 text-white md:p-10"
            >
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold-500/15 blur-3xl" aria-hidden />
              <h2 className="relative text-xl font-bold md:text-2xl">
                Medical Admission Guidance for Government Medical Colleges
              </h2>
              <div className="relative mt-5 space-y-4 text-slate-200 leading-relaxed">
                <p>
                  Government medical colleges remain the preferred choice for many students due to affordable
                  fees, excellent academics, and extensive clinical exposure.
                </p>
                <p>
                  Our expert{' '}
                  <SeoLink href={HOME_INTERNAL_PATHS.neetAspirantsGuidance} light>
                    Medical Admission Guidance for NEET Aspirants
                  </SeoLink>{' '}
                  helps students understand{' '}
                  <SeoLink href={HOME_INTERNAL_PATHS.neetUgCounselling} light>
                    NEET UG Counselling
                  </SeoLink>{' '}
                  procedures, seat allocation systems, choice filling strategies, and cutoff trends.
                </p>
                <p>
                  With accurate information and strategic planning, students can confidently participate in
                  counseling rounds and make informed decisions.
                </p>
              </div>
            </motion.article>
            <motion.article
              {...reveal}
              className="rounded-3xl border border-slate-200 bg-slate-50/80 p-8 md:p-10"
            >
              <h2 className="text-xl font-bold text-navy-900 md:text-2xl">
                How Medical Admission Guidance Helps Students Secure Better Opportunities
              </h2>
              <div className="mt-5 space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Private medical colleges offer excellent educational infrastructure, advanced facilities,
                  and quality medical training. For students who wish to{' '}
                  <SeoLink href={HOME_INTERNAL_PATHS.studyMbbsInIndia}>Study MBBS in India</SeoLink>, private
                  institutions often provide valuable opportunities to achieve their medical career goals.
                </p>
                <p>
                  Our <SeoLink href={HOME_INTERNAL_PATHS.admissionCounselling}>Admission Counselling for Medical Students</SeoLink> helps evaluate private colleges based on academic quality, clinical exposure, infrastructure, fee structures, and future career prospects.
                </p>
                <p>
                  We ensure students and parents receive transparent information that helps them make
                  confident admission decisions.
                </p>
              </div>
            </motion.article>
          </div>
        </div>
      </section>

      {/* —— SERVICES (no blank cell) —— */}
      <section id="admission-counselling-services" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionEyebrow>Our services</SectionEyebrow>
          <motion.div {...reveal} className="mb-10 max-w-3xl">
            <h2 className="text-2xl font-bold text-navy-900 md:text-3xl">
              Admission Counselling for Medical Students Services by AR Group of Education
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              At AR Group of Education, we believe every student deserves access to accurate information and
              professional guidance. Our services include:
            </p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HOME_AR_SERVICES.map((service) => (
              <motion.div
                key={service}
                {...reveal}
                className="flex gap-3 rounded-2xl border border-slate-200/90 bg-white p-5 text-sm leading-relaxed text-slate-700 shadow-sm transition-shadow hover:shadow-md"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden />
                <span>{service}</span>
              </motion.div>
            ))}
          </div>
          <motion.p {...reveal} className="mx-auto mt-10 max-w-2xl text-center text-slate-600 leading-relaxed">
            Over the years, we have successfully guided thousands of students toward medical colleges in
            India and abroad through our trusted{' '}
            <SeoLink href={HOME_INTERNAL_PATHS.medicalAdmissionGuidance}>Medical Admission Guidance</SeoLink>{' '}
            and admission support services.
          </motion.p>
        </div>
      </section>

      {/* —— MD/MS + WHY —— */}
      <section className="bg-navy-900 py-16 text-white md:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionEyebrow>
            <span className="text-gold-400">Long-term success</span>
          </SectionEyebrow>
          <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
            <motion.article {...reveal} className="lg:col-span-2">
              <GraduationCap className="mb-4 h-8 w-8 text-gold-400" aria-hidden />
              <h2 className="text-2xl font-bold">Beyond MBBS: Planning for Future Medical Success</h2>
              <div className="mt-5 space-y-4 text-slate-300 leading-relaxed">
                <p>
                  Medical education does not end with MBBS. Students often aspire to pursue postgraduate
                  specialization programs after completing their undergraduate studies.
                </p>
                <p>
                  Understanding opportunities such as{' '}
                  <SeoLink href={HOME_INTERNAL_PATHS.mdMsAdmissionIndia} light>
                    MD MS Admission in India
                  </SeoLink>{' '}
                  helps students plan their long-term career pathways effectively.
                </p>
                <p>
                  Our counselors provide valuable insights regarding{' '}
                  <SeoLink href={HOME_INTERNAL_PATHS.mdMsAdmissionIndia} light>
                    MD MS Admission in India
                  </SeoLink>
                  , helping students create a roadmap for continuous academic and professional growth.
                </p>
              </div>
            </motion.article>
            <motion.article
              {...reveal}
              className="lg:col-span-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-8 backdrop-blur-sm"
            >
              <Award className="mb-4 h-8 w-8 text-gold-400" aria-hidden />
              <h2 className="text-2xl font-bold">
                Why is MBBS Admission Consultancy Important for NEET Aspirants?
              </h2>
              <div className="mt-5 space-y-4 text-slate-300 leading-relaxed">
                <p>
                  Choosing the right medical admission consultant can make a significant difference in your
                  academic journey. With 21+ years of experience, AR Group of Education has helped thousands of
                  aspiring doctors secure admissions in top medical colleges across India and abroad. Unlike
                  many consultants who focus only on admissions, we provide complete guidance, personalized
                  support, and transparent counseling to help students make informed career decisions. Our
                  commitment is not just to secure a seat but to help students build a successful future in
                  the medical field.
                </p>
                <p>
                  From <SeoLink href={HOME_INTERNAL_PATHS.neetUgCounselling} light>NEET UG Counselling</SeoLink>{' '}
                  and college selection to MBBS abroad admissions and postgraduate opportunities, our expert
                  team supports students at every step. We believe in honest guidance, student-first
                  counseling, and end-to-end assistance that simplifies the entire admission process for
                  students and parents.
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

      {/* —— FINAL THOUGHTS —— */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-50/80 via-white to-gold-50/40 py-14 md:py-20">
        <div
          className="pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full bg-navy-400/8 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-gold-400/15 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto w-full max-w-[90rem] px-4 sm:px-5 md:px-6 lg:px-7 xl:px-8">
          <motion.div
            {...reveal}
            className="relative overflow-hidden rounded-3xl border border-navy-200/70 bg-gradient-to-br from-white via-navy-50/30 to-gold-50/50 shadow-2xl shadow-navy-900/12 ring-1 ring-gold-300/35"
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold-400/12 blur-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -left-10 bottom-20 h-40 w-40 rounded-full bg-navy-400/10 blur-2xl"
              aria-hidden
            />

            {/* Header — top center */}
            <div className="relative border-b border-gold-200/50 bg-white/40 px-6 py-10 text-center backdrop-blur-sm md:px-10 md:py-12 lg:px-14">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold-800">
                <Sparkles className="h-3.5 w-3.5 text-gold-600" aria-hidden />
                Closing note
              </span>
              <h2 className="mt-5 font-serif text-3xl font-bold leading-tight text-navy-900 sm:text-4xl md:text-5xl lg:text-[3.25rem]">
                Final{' '}
                <span className="bg-gradient-to-r from-gold-500 via-gold-600 to-amber-500 bg-clip-text text-transparent">
                  Thoughts
                </span>
              </h2>
              <div className="mx-auto mt-7 flex max-w-md items-center justify-center gap-3" aria-hidden>
                <span className="h-px flex-1 max-w-[4rem] bg-gradient-to-r from-transparent to-gold-400/70 sm:max-w-none" />
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-gold-400 shadow-lg shadow-navy-900/25 ring-2 ring-gold-400/20">
                  <Stethoscope className="h-5 w-5" />
                </span>
                <span className="h-px w-8 bg-gold-400/50" />
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-navy-100 bg-white text-navy-700 shadow-md">
                  <Globe2 className="h-5 w-5" />
                </span>
                <span className="h-px w-8 bg-gold-400/50" />
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-lg shadow-gold-500/30">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <span className="h-px flex-1 max-w-[4rem] bg-gradient-to-l from-transparent to-gold-400/70 sm:max-w-none" />
              </div>
            </div>

            {/* Content */}
            <div className="relative grid gap-5 p-6 md:grid-cols-2 md:gap-6 md:p-8 lg:gap-8 lg:p-10">
              <motion.div
                {...reveal}
                transition={{ ...reveal.transition, delay: 0.1 }}
                className="group relative overflow-hidden rounded-2xl border border-white/90 bg-white/90 p-6 shadow-md shadow-navy-900/5 ring-1 ring-slate-100 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:ring-gold-200/60 md:p-8"
              >
                <div
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold-500 via-amber-400 to-gold-300"
                  aria-hidden
                />
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold-50 text-gold-600 ring-1 ring-gold-200/80">
                  <HeartHandshake className="h-5 w-5" aria-hidden />
                </span>
                <p className="text-sm leading-[1.85] text-slate-600 md:text-base">
                  The journey toward becoming a doctor requires determination, strategic planning, and expert
                  support. Professional{' '}
                  <SeoLink href={HOME_INTERNAL_PATHS.medicalAdmissionGuidance}>
                    Medical Admission Guidance
                  </SeoLink>
                  , trusted{' '}
                  <SeoLink href={HOME_INTERNAL_PATHS.mbbsAdmissionConsultancy}>
                    MBBS Admission Consultancy
                  </SeoLink>
                  , personalized{' '}
                  <SeoLink href={HOME_INTERNAL_PATHS.admissionCounselling}>
                    Admission Counselling for Medical Students
                  </SeoLink>
                  , reliable{' '}
                  <SeoLink href={HOME_INTERNAL_PATHS.medicalCollegeAdmissionAssistance}>
                    Medical College Admission Assistance
                  </SeoLink>
                  , expert{' '}
                  <SeoLink href={HOME_INTERNAL_PATHS.mbbsAbroadConsultancy}>
                    MBBS Abroad Consultancy
                  </SeoLink>
                  , and specialized{' '}
                  <SeoLink href={HOME_INTERNAL_PATHS.neetAspirantsGuidance}>
                    Medical Admission Guidance for NEET Aspirants
                  </SeoLink>{' '}
                  can make the admission process significantly easier and more successful.
                </p>
              </motion.div>

              <motion.div
                {...reveal}
                transition={{ ...reveal.transition, delay: 0.18 }}
                className="group relative overflow-hidden rounded-2xl border border-white/90 bg-white/90 p-6 shadow-md shadow-navy-900/5 ring-1 ring-slate-100 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:ring-gold-200/60 md:p-8"
              >
                <div
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-navy-700 via-navy-600 to-navy-500"
                  aria-hidden
                />
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-navy-100">
                  <Award className="h-5 w-5" aria-hidden />
                </span>
                <p className="text-sm leading-[1.85] text-slate-600 md:text-base">
                  Whether your goal is to pursue medical education in India or abroad, AR Group of Education
                  is committed to helping you achieve your dreams. From{' '}
                  <SeoLink href={HOME_INTERNAL_PATHS.neetUgCounselling}>NEET UG Counselling</SeoLink> and
                  admission planning to future opportunities such as{' '}
                  <SeoLink href={HOME_INTERNAL_PATHS.mdMsAdmissionIndia}>MD MS Admission in India</SeoLink>, we
                  remain your trusted partner throughout your medical education journey.
                </p>
              </motion.div>
            </div>

            <div className="relative mx-6 mb-6 overflow-hidden rounded-2xl bg-navy-900 px-5 py-6 md:mx-8 md:px-8 md:py-7 lg:mx-10 lg:mb-10">
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-gold-500/10 via-transparent to-gold-500/10"
                aria-hidden
              />
              <div className="relative flex flex-col flex-wrap items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
                <Link href="/contact" className="ui-btn ui-btn--primary ui-btn--lg group w-full sm:w-auto">
                  Book free counselling
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
                <Link
                  href={HOME_INTERNAL_PATHS.neetRankPredictor}
                  className="ui-btn ui-btn--secondary ui-btn--lg group w-full sm:w-auto"
                >
                  NEET Rank Predictor
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
                <a
                  href={`tel:${CONTACT_INFO.phoneTel}`}
                  className="ui-btn ui-btn--lg w-full border border-white/20 bg-white/10 !text-white hover:!bg-white/15 sm:w-auto"
                >
                  <Phone className="h-5 w-5" aria-hidden />
                  {CONTACT_INFO.phone}
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
