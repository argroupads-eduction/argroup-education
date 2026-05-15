'use client';

import { motion } from 'framer-motion';
import { STATISTICS } from '@/lib/constants';
import { CounterCard } from '@/components/ui/CounterCard';

export const AchievementsSection = () => {
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.2 },
    },
  };

  return (
    <section className="section bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-6">
            Our <span className="text-gold-500">Proven Track Record</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Trusted by thousands of students across India and globally
          </p>
        </motion.div>

        {/* Statistics Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {STATISTICS.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <CounterCard
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-16" />

        {/* Why Choose Us */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="text-center">
            <div className="text-4xl mb-4">🎓</div>
            <h3 className="text-xl font-bold text-navy-900 mb-3">Expert Team</h3>
            <p className="text-gray-600">
              19+ years of experience with dedicated counselors
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🏥</div>
            <h3 className="text-xl font-bold text-navy-900 mb-3">Top Universities</h3>
            <p className="text-gray-600">
              Partnerships with 500+ accredited medical colleges
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">✈️</div>
            <h3 className="text-xl font-bold text-navy-900 mb-3">Complete Support</h3>
            <p className="text-gray-600">
              From counseling to visa to pre-departure assistance
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
