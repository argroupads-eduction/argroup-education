'use client';

import { motion } from 'framer-motion';
import { TestimonialMarquee } from './TestimonialMarquee';

export const TestimonialsSection = () => {
  return (
    <section className="section overflow-x-hidden bg-gray-50">
      <div className="max-w-7xl mx-auto min-w-0 px-4 sm:px-6">
        <motion.div
          className="text-center mb-10 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-balance text-2xl sm:text-4xl md:text-5xl font-bold text-navy-900 mb-3 md:mb-6 px-1">
            Success <span className="text-gold-500">Stories</span> from Our Students
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-2">
            Hear from students who achieved their dreams with AR Group
          </p>
        </motion.div>
      </div>

      <TestimonialMarquee />
    </section>
  );
};
