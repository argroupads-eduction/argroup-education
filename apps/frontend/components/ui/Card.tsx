'use client';

import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
}

export const Card = ({
  children,
  className = '',
  hover = true,
  glass = false,
}: CardProps) => {
  const baseClasses = 'rounded-lg p-6';
  const glassClasses = glass
    ? 'bg-white bg-opacity-10 backdrop-blur-xl border border-white border-opacity-10 shadow-glass'
    : 'bg-white border border-gray-200 shadow-elevation-1';
  const hoverClasses = hover ? 'transition-all hover:shadow-elevation-2' : '';

  return (
    <motion.div
      className={`${baseClasses} ${glassClasses} ${hoverClasses} ${className}`}
      whileHover={hover ? { y: -4 } : {}}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};
