'use client';

import { motion } from 'framer-motion';
import { TestimonialMarquee } from './TestimonialMarquee';

export const TestimonialsSection = () => {
  return (
    <section className="section bg-gray-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          className="text-center mb-10 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy-900 mb-4 md:mb-6">
            Success <span className="text-gold-500">Stories</span> from Our Students
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-2">
            Hear from students who achieved their dreams with AR Group
          </p>
        </motion.div>
      </div>

      <TestimonialMarquee />
    </section>
  );
};
