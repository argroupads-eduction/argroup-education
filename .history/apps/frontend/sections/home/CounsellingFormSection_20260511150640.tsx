'use client';

import { motion } from 'framer-motion';
import { CounsellingForm } from '@/components/forms/CounsellingForm';

export const CounsellingFormSection = () => {
  return (
    <section className="section bg-gradient-to-r from-navy-900 to-navy-800">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Get Your <span className="text-gold-500">Free Counselling</span>
          </h2>
          <p className="text-xl text-gray-300">
            Share your details and our expert counselors will guide you to the perfect university
          </p>
        </motion.div>

        {/* Form Background Card */}
        <motion.div
          className="bg-white rounded-2xl p-8 md:p-12 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <CounsellingForm />
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          className="text-center mt-8 text-gray-400"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p>✓ 100% Confidential • ✓ No Hidden Charges • ✓ Expert Guidance</p>
        </motion.div>
      </div>
    </section>
  );
};
