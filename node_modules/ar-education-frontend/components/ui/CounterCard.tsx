'use client';

import { motion } from 'framer-motion';

interface CounterProps {
  label: string;
  value: string;
  icon?: string;
}

export const CounterCard = ({ label, value, icon }: CounterProps) => {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      {icon && <div className="text-gold-500 text-sm font-semibold mb-2">{icon}</div>}
      <motion.div
        className="text-4xl md:text-5xl font-bold text-gold-500 mb-2"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {value}
      </motion.div>
      <p className="text-gray-600 text-sm md:text-base">{label}</p>
    </motion.div>
  );
};
