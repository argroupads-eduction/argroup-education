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
    <section id="faqs" className="section overflow-x-hidden bg-white">
      <div className="max-w-4xl mx-auto min-w-0 px-4 sm:px-6">
        <motion.div
          className="text-center mb-10 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-balance text-2xl sm:text-3xl md:text-5xl font-bold text-navy-900 mb-4 md:mb-6">
            Frequently Asked <span className="text-gold-500">Questions</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-1">
            Find answers to common questions about medical admission guidance, MBBS in India &amp; abroad,
            and MD/MS counselling
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Accordion items={accordionItems} defaultOpen={HOME_PAGE_FAQS[0].id} />
        </motion.div>

        <motion.div
          className="text-center mt-8 md:mt-12 bg-navy-50 rounded-lg p-6 sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className="text-navy-900 font-semibold mb-3">Didn&apos;t find your answer?</p>
          <p className="text-gray-600 mb-4">Contact our counselors for personalized guidance</p>
          <a
            href={`tel:${CONTACT_INFO.phoneTel}`}
            className="ui-btn ui-btn--primary ui-btn--lg touch-manipulation"
          >
            Call Us Now
          </a>
        </motion.div>
      </div>
    </section>
  );
};
