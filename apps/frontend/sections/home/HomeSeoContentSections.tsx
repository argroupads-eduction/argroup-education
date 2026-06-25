'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Globe2,
  GraduationCap,
  HeartHandshake,
  MapPin,
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

function SeoLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="font-semibold text-gold-600 underline decoration-gold-400/50 underline-offset-2 transition-colors hover:text-gold-700"
    >
      {children}
    </Link>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] as const },
  viewport: { once: true, margin: '-60px' as const },
};

function SectionShell({
  id,
  children,
  className = '',
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`relative overflow-hidden py-14 md:py-20 ${className}`}>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">{children}</div>
    </section>
  );
}

function SectionHeading({ children, as = 'h2' }: { children: React.ReactNode; as?: 'h1' | 'h2' }) {
  const Tag = as;
  return (
    <Tag className="text-balance text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl md:text-4xl">
      {children}
    </Tag>
  );
}

export function HomeSeoContentSections() {
  return (
    <>
      {/* H1 + intro */}
      <SectionShell className="bg-gradient-to-b from-slate-50 via-white to-white">
        <motion.div {...fadeUp} className="mx-auto max-w-4xl text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gold-800">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Trusted since 2005
          </span>
          <SectionHeading as="h1">{HOME_PAGE_H1}</SectionHeading>
          <div className="mt-6 space-y-4 text-left text-base leading-relaxed text-slate-700 md:text-lg">
            <p>
              Becoming a doctor is a dream shared by thousands of students across India. However, with
              increasing competition, limited medical seats, and complex admission procedures, securing
              admission to the right medical college requires more than just academic excellence. Students
              need expert guidance, strategic planning, and accurate information to make informed decisions
              about their medical careers.
            </p>
            <p>
              This is where professional <SeoLink href={HOME_INTERNAL_PATHS.medicalAdmissionGuidance}>Medical Admission Guidance</SeoLink>, trusted{' '}
              <SeoLink href={HOME_INTERNAL_PATHS.mbbsAdmissionConsultancy}>MBBS Admission Consultancy</SeoLink>, expert{' '}
              <SeoLink href={HOME_INTERNAL_PATHS.admissionCounselling}>Admission Counselling for Medical Students</SeoLink>, and reliable{' '}
              <SeoLink href={HOME_INTERNAL_PATHS.medicalCollegeAdmissionAssistance}>Medical College Admission Assistance</SeoLink> become essential.
              Whether you want to pursue MBBS in India or explore global opportunities through{' '}
              <SeoLink href={HOME_INTERNAL_PATHS.mbbsAbroadConsultancy}>MBBS Abroad Consultancy</SeoLink>, the right support can help you achieve your
              career goals with confidence.
            </p>
            <p>
              At AR Group of Education, we have been helping aspiring doctors secure admissions in leading
              medical colleges across India and abroad for over 21 years. Our mission is to provide
              transparent counseling, personalized support, and complete admission assistance that empowers
              students to make the best choices for their future.
            </p>
          </div>
        </motion.div>
      </SectionShell>

      {/* Why guidance + counselling */}
      <SectionShell id="medical-admission-guidance" className="bg-white">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.article {...fadeUp} className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm md:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-gold-400">
              <Stethoscope className="h-6 w-6" aria-hidden />
            </div>
            <SectionHeading>Why Professional Medical Admission Guidance Matters</SectionHeading>
            <div className="mt-4 space-y-4 text-slate-700 leading-relaxed">
              <p>
                Medical admissions have become increasingly competitive due to rising numbers of applicants
                and limited seats. Professional <SeoLink href={HOME_INTERNAL_PATHS.medicalAdmissionGuidance}>Medical Admission Guidance</SeoLink> helps students
                understand admission procedures, evaluate available opportunities, and develop effective
                admission strategies.
              </p>
              <p>
                Every student has different academic strengths, NEET scores, financial considerations, and
                career goals. Through personalized counseling sessions, we analyze these factors and provide
                customized recommendations that align with each student&apos;s aspirations.
              </p>
              <p>
                Our specialized <SeoLink href={HOME_INTERNAL_PATHS.neetAspirantsGuidance}>Admission Guidance for NEET Aspirants</SeoLink> helps students
                understand counseling rounds, cutoff trends, seat allocation processes, and admission
                opportunities. With proper planning and expert support, students can significantly improve
                their chances of securing admission to reputed medical institutions.
              </p>
            </div>
          </motion.article>

          <motion.article {...fadeUp} className="rounded-3xl border border-gold-200/60 bg-gradient-to-br from-gold-50/80 to-white p-6 shadow-sm md:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-500 text-white">
              <HeartHandshake className="h-6 w-6" aria-hidden />
            </div>
            <SectionHeading>Admission Counselling for Medical Students</SectionHeading>
            <div className="mt-4 space-y-4 text-slate-700 leading-relaxed">
              <p>
                Choosing the right medical college is one of the most important decisions in a student&apos;s
                life. Our comprehensive <SeoLink href={HOME_INTERNAL_PATHS.admissionCounselling}>Admission Counselling for Medical Students</SeoLink> is designed
                to simplify this process and help students make informed decisions.
              </p>
              <p>
                We assist students in understanding college rankings, accreditation, fee structures,
                infrastructure, clinical exposure, and future career opportunities. Through personalized
                counseling, students receive accurate information that helps them select institutions that
                best match their academic goals and financial capabilities.
              </p>
              <p>
                Our experienced counselors provide <SeoLink href={HOME_INTERNAL_PATHS.admissionCounselling}>Admission Counselling for Medical Students</SeoLink>{' '}
                seeking admission to government medical colleges, private medical colleges, deemed
                universities, and international medical institutions.
              </p>
            </div>
          </motion.article>
        </div>
      </SectionShell>

      {/* Assistance + benefits */}
      <SectionShell id="mbbs-admission-consultancy" className="bg-navy-900 text-white">
        <div className="grid gap-12 lg:grid-cols-2">
          <motion.div {...fadeUp}>
            <SectionHeading>
              <span className="text-white">Medical College Admission Assistance from Start to Finish</span>
            </SectionHeading>
            <p className="mt-4 text-slate-300 leading-relaxed">
              The admission process involves multiple stages, including college selection, application
              submission, counseling registration, document verification, and final admission
              confirmation. Our professional{' '}
              <SeoLink href={HOME_INTERNAL_PATHS.medicalCollegeAdmissionAssistance}>Medical College Admission Assistance</SeoLink> ensures that students
              receive support at every stage of this journey.
            </p>
            <p className="mt-3 font-medium text-gold-300">We help students:</p>
            <ul className="mt-4 space-y-3">
              {HOME_ADMISSION_ASSISTANCE_STEPS.map((step) => (
                <li key={step} className="flex gap-3 text-slate-200">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" aria-hidden />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-slate-300 leading-relaxed">
              Our end-to-end <SeoLink href={HOME_INTERNAL_PATHS.medicalCollegeAdmissionAssistance}>Medical College Admission Assistance</SeoLink> reduces
              confusion and helps students navigate the admission process with confidence.
            </p>
          </motion.div>

          <motion.div {...fadeUp}>
            <SectionHeading>
              <span className="text-white">Benefits of Choosing an MBBS Admission Consultancy</span>
            </SectionHeading>
            <p className="mt-4 text-slate-300 leading-relaxed">
              Selecting the right medical college can shape a student&apos;s future career. A trusted{' '}
              <SeoLink href={HOME_INTERNAL_PATHS.mbbsAdmissionConsultancy}>MBBS Admission Consultancy</SeoLink> simplifies the admission process by providing
              expert guidance and personalized support.
            </p>
            <p className="mt-3 font-medium text-gold-300">Benefits include:</p>
            <ul className="mt-4 space-y-3">
              {HOME_CONSULTANCY_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-slate-300 leading-relaxed">
              Students also benefit from professional <SeoLink href={HOME_INTERNAL_PATHS.medicalCollegeAdmissionAssistance}>Medical College Admission Assistance</SeoLink>, which helps them compare institutions, understand regulations, and identify the best opportunities available.
            </p>
          </motion.div>
        </div>
      </SectionShell>

      {/* MBBS abroad */}
      <SectionShell id="mbbs-abroad-consultancy" className="bg-gradient-to-b from-white to-slate-50">
        <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-gold-400">
            <Globe2 className="h-6 w-6" aria-hidden />
          </div>
          <SectionHeading>MBBS Abroad Consultancy for Global Medical Education</SectionHeading>
          <p className="mt-4 text-slate-700 leading-relaxed">
            Studying medicine abroad has become an attractive option for students seeking quality education,
            global exposure, and affordable tuition fees. Our professional{' '}
            <SeoLink href={HOME_INTERNAL_PATHS.mbbsAbroadConsultancy}>MBBS Abroad Consultancy</SeoLink> services help students explore internationally
            recognized medical universities that offer excellent academic and clinical training.
          </p>
          <p className="mt-3 text-slate-700">Students can choose from leading destinations such as:</p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_ABROAD_DESTINATIONS.map((country, i) => (
            <motion.div
              key={country.name}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.04 }}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gold-500" aria-hidden />
                <Link href={country.href} className="text-lg font-bold text-navy-900 group-hover:text-gold-600">
                  {country.name}
                </Link>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">{country.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.p {...fadeUp} className="mx-auto mt-10 max-w-3xl text-center text-slate-700 leading-relaxed">
          Our <SeoLink href={HOME_INTERNAL_PATHS.mbbsAbroadConsultancy}>MBBS Abroad Consultancy</SeoLink> services include university selection, eligibility
          assessment, application processing, admission confirmation, visa assistance, accommodation support,
          and pre-departure guidance. By choosing our expert to{' '}
          <SeoLink href={HOME_INTERNAL_PATHS.studyMbbsAbroadConsultancy}>Study MBBS Abroad Consultancy</SeoLink>, students can confidently pursue medical
          education at globally recognized universities while receiving complete support throughout their
          journey.
        </motion.p>
      </SectionShell>

      {/* India government + private */}
      <SectionShell className="bg-white">
        <div className="grid gap-8 lg:grid-cols-2">
          <motion.article {...fadeUp} className="rounded-3xl border border-slate-200 p-6 md:p-8">
            <SectionHeading>Medical Admission Guidance for Government Medical Colleges</SectionHeading>
            <div className="mt-4 space-y-4 text-slate-700 leading-relaxed">
              <p>
                Government medical colleges remain the preferred choice for many students due to affordable
                fees, excellent academics, and extensive clinical exposure.
              </p>
              <p>
                Our expert <SeoLink href={HOME_INTERNAL_PATHS.neetAspirantsGuidance}>Medical Admission Guidance for NEET Aspirants</SeoLink> helps students
                understand <SeoLink href={HOME_INTERNAL_PATHS.neetUgCounselling}>NEET UG Counselling</SeoLink> procedures, seat allocation systems, choice
                filling strategies, and cutoff trends. We provide personalized guidance that enables students
                to maximize their chances of securing seats in reputed government medical institutions.
              </p>
              <p>
                With accurate information and strategic planning, students can confidently participate in
                counseling rounds and make informed decisions.
              </p>
            </div>
          </motion.article>

          <motion.article {...fadeUp} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
            <SectionHeading>How Medical Admission Guidance Helps Students Secure Better Opportunities</SectionHeading>
            <div className="mt-4 space-y-4 text-slate-700 leading-relaxed">
              <p>
                Private medical colleges offer excellent educational infrastructure, advanced facilities, and
                quality medical training. For students who wish to{' '}
                <SeoLink href={HOME_INTERNAL_PATHS.studyMbbsInIndia}>Study MBBS in India</SeoLink>, private institutions often provide valuable
                opportunities to achieve their medical career goals.
              </p>
              <p>
                Our <SeoLink href={HOME_INTERNAL_PATHS.admissionCounselling}>Admission Counselling for Medical Students</SeoLink> helps evaluate private
                colleges based on academic quality, clinical exposure, infrastructure, fee structures, and
                future career prospects.
              </p>
              <p>
                We ensure students and parents receive transparent information that helps them make confident
                admission decisions.
              </p>
            </div>
          </motion.article>
        </div>
      </SectionShell>

      {/* Services grid */}
      <SectionShell id="admission-counselling-services" className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white">
        <motion.div {...fadeUp} className="text-center">
          <SectionHeading>
            <span className="text-white">Admission Counselling for Medical Students Services by AR Group of Education</span>
          </SectionHeading>
          <p className="mx-auto mt-4 max-w-3xl text-slate-300 leading-relaxed">
            At AR Group of Education, we believe every student deserves access to accurate information and
            professional guidance. Our services include:
          </p>
        </motion.div>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_AR_SERVICES.map((service, i) => (
            <motion.li
              key={service}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.03 }}
              className="flex gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
              <span>{service}</span>
            </motion.li>
          ))}
        </ul>
        <motion.p {...fadeUp} className="mx-auto mt-10 max-w-3xl text-center text-slate-300 leading-relaxed">
          Over the years, we have successfully guided thousands of students toward medical colleges in India
          and abroad through our trusted <SeoLink href={HOME_INTERNAL_PATHS.medicalAdmissionGuidance}>Medical Admission Guidance</SeoLink> and admission
          support services.
        </motion.p>
      </SectionShell>

      {/* Beyond MBBS + why consultancy */}
      <SectionShell className="bg-white">
        <div className="grid gap-10 lg:grid-cols-2">
          <motion.article {...fadeUp}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-100 text-gold-700">
              <GraduationCap className="h-6 w-6" aria-hidden />
            </div>
            <SectionHeading>Beyond MBBS: Planning for Future Medical Success</SectionHeading>
            <div className="mt-4 space-y-4 text-slate-700 leading-relaxed">
              <p>
                Medical education does not end with MBBS. Students often aspire to pursue postgraduate
                specialization programs after completing their undergraduate studies.
              </p>
              <p>
                Understanding opportunities such as <SeoLink href={HOME_INTERNAL_PATHS.mdMsAdmissionIndia}>MD MS Admission in India</SeoLink> helps students
                plan their long-term career pathways effectively. Early awareness of postgraduate admission
                requirements, specialization options, and career opportunities can contribute significantly to
                future professional success.
              </p>
              <p>
                Our counselors provide valuable insights regarding <SeoLink href={HOME_INTERNAL_PATHS.mdMsAdmissionIndia}>MD MS Admission in India</SeoLink>,
                helping students create a roadmap for continuous academic and professional growth.
              </p>
            </div>
          </motion.article>

          <motion.article {...fadeUp} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
            <SectionHeading>Why is MBBS Admission Consultancy Important for NEET Aspirants?</SectionHeading>
            <div className="mt-4 space-y-4 text-slate-700 leading-relaxed">
              <p>
                Choosing the right medical admission consultant can make a significant difference in your
                academic journey. With 21+ years of experience, AR Group of Education has helped thousands
                of aspiring doctors secure admissions in top medical colleges across India and abroad. Unlike
                many consultants who focus only on admissions, we provide complete guidance, personalized
                support, and transparent counseling to help students make informed career decisions. Our
                commitment is not just to secure a seat but to help students build a successful future in the
                medical field.
              </p>
              <p>
                From <SeoLink href={HOME_INTERNAL_PATHS.neetUgCounselling}>NEET UG Counselling</SeoLink> and college selection to MBBS abroad admissions and
                postgraduate opportunities, our expert team supports students at every step. We believe in honest
                guidance, student-first counseling, and end-to-end assistance that simplifies the entire
                admission process for students and parents.
              </p>
            </div>
          </motion.article>
        </div>
      </SectionShell>

      {/* Differentiators */}
      <SectionShell id="what-makes-us-different" className="bg-slate-50">
        <motion.div {...fadeUp} className="text-center">
          <SectionHeading>What Makes Us Different?</SectionHeading>
        </motion.div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {HOME_DIFFERENTIATORS.map((item, i) => (
            <motion.li
              key={item}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.03 }}
              className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-500" aria-hidden />
              <span className="text-slate-700">{item}</span>
            </motion.li>
          ))}
        </ul>
      </SectionShell>

      {/* Final thoughts */}
      <SectionShell className="border-t border-slate-200 bg-white">
        <motion.div {...fadeUp} className="mx-auto max-w-4xl">
          <SectionHeading>Final Thoughts</SectionHeading>
          <div className="mt-6 space-y-4 text-slate-700 leading-relaxed md:text-lg">
            <p>
              The journey toward becoming a doctor requires determination, strategic planning, and expert
              support. Professional <SeoLink href={HOME_INTERNAL_PATHS.medicalAdmissionGuidance}>Medical Admission Guidance</SeoLink>, trusted{' '}
              <SeoLink href={HOME_INTERNAL_PATHS.mbbsAdmissionConsultancy}>MBBS Admission Consultancy</SeoLink>, personalized{' '}
              <SeoLink href={HOME_INTERNAL_PATHS.admissionCounselling}>Admission Counselling for Medical Students</SeoLink>, reliable{' '}
              <SeoLink href={HOME_INTERNAL_PATHS.medicalCollegeAdmissionAssistance}>Medical College Admission Assistance</SeoLink>, expert{' '}
              <SeoLink href={HOME_INTERNAL_PATHS.mbbsAbroadConsultancy}>MBBS Abroad Consultancy</SeoLink>, and specialized{' '}
              <SeoLink href={HOME_INTERNAL_PATHS.neetAspirantsGuidance}>Medical Admission Guidance for NEET Aspirants</SeoLink> can make the admission
              process significantly easier and more successful.
            </p>
            <p>
              Whether your goal is to pursue medical education in India or abroad, AR Group of Education is
              committed to helping you achieve your dreams. From <SeoLink href={HOME_INTERNAL_PATHS.neetUgCounselling}>NEET UG Counselling</SeoLink> and
              admission planning to future opportunities such as <SeoLink href={HOME_INTERNAL_PATHS.mdMsAdmissionIndia}>MD MS Admission in India</SeoLink>, we
              remain your trusted partner throughout your medical education journey.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="ui-btn ui-btn--primary ui-btn--md inline-flex items-center gap-2"
            >
              Book free counselling
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href={HOME_INTERNAL_PATHS.neetRankPredictor} className="ui-btn ui-btn--secondary ui-btn--md">
              NEET Rank Predictor
            </Link>
          </div>
        </motion.div>
      </SectionShell>
    </>
  );
}
