'use client';

import { motion } from 'framer-motion';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'gold';
  className?: string;
}

export const Badge = ({
  children,
  variant = 'primary',
  className = '',
}: BadgeProps) => {
  const variants = {
    primary: 'bg-sky-100 text-sky-800',
    secondary: 'bg-gray-100 text-gray-800',
    gold: 'bg-gold-100 text-gold-800',
  };

  return (
    <motion.span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.span>
  );
};
