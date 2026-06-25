'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CONTACT_INFO } from '@/lib/constants';
import { HOME_PAGE_FAQS } from '@/lib/homePageSeoContent';
import { Accordion } from '@/components/ui/Accordion';

export const FAQSection = () => {
  const accordionItems = HOME_PAGE_FAQS.map((faq) => ({
    id: faq.id,
    title: faq.question,
    content:
      'linkHref' in faq && faq.linkHref && faq.linkLabel ? (
        <>
          {'linkLeadIn' in faq && faq.linkLeadIn ? `${faq.linkLeadIn} ` : null}
          <Link
            href={faq.linkHref}
            className="font-semibold text-gold-600 underline-offset-2 hover:text-gold-700 hover:underline"
          >
            {faq.linkLabel}
          </Link>{' '}
          {faq.answer}
        </>
      ) : (
        faq.answer
      ),
  }));

  return (
    <section
      id="faqs"
      className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white py-14 md:py-20"
    >
      <div
        className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-navy-400/8 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-10 max-w-3xl md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-gold-700">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-500" aria-hidden />
            FAQs
          </span>
          <h2 className="mt-5 text-balance font-serif text-2xl font-bold text-navy-900 sm:text-3xl md:text-4xl lg:text-5xl">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-gold-500 to-gold-600 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="mt-4 text-left text-base leading-relaxed text-slate-600 md:text-lg">
            Find answers to common questions about medical admission guidance, MBBS in India &amp; abroad,
            and MD/MS counselling
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          viewport={{ once: true }}
        >
          <Accordion items={accordionItems} defaultOpen={HOME_PAGE_FAQS[0].id} variant="premium" />
        </motion.div>

        <motion.div
          className="mt-8 rounded-2xl border border-navy-100 bg-navy-50 p-6 text-center sm:p-8 md:mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p className="font-semibold text-navy-900">Didn&apos;t find your answer?</p>
          <p className="mt-2 text-gray-600">Contact our counselors for personalized guidance</p>
          <a
            href={`tel:${CONTACT_INFO.phoneTel}`}
            className="ui-btn ui-btn--primary ui-btn--lg mt-5 touch-manipulation"
          >
            Call Us Now
          </a>
        </motion.div>
      </div>
    </section>
  );
};
