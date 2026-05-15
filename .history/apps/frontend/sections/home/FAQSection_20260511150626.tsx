'use client';

import { motion } from 'framer-motion';
import { FAQ_DATA } from '@/lib/constants';
import { Accordion } from '@/components/ui/Accordion';

export const FAQSection = () => {
  const accordionItems = FAQ_DATA.map((faq) => ({
    id: faq.question,
    title: faq.question,
    content: faq.answer,
  }));

  return (
    <section className="section bg-white">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-6">
            Frequently Asked <span className="text-gold-500">Questions</span>
          </h2>
          <p className="text-xl text-gray-600">
            Find answers to common questions about studying MBBS abroad
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Accordion items={accordionItems} defaultOpen={FAQ_DATA[0].question} />
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12 bg-navy-50 rounded-lg p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className="text-navy-900 font-semibold mb-3">
            Didn't find your answer?
          </p>
          <p className="text-gray-600 mb-4">
            Contact our counselors for personalized guidance
          </p>
          <a
            href="tel:+918001234567"
            className="inline-block bg-gold-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gold-600 transition-colors"
          >
            Call Us Now
          </a>
        </motion.div>
      </div>
    </section>
  );
};
