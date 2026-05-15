'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  count?: number;
  height?: string;
}

export const Skeleton = ({
  className = '',
  count = 1,
  height = '1rem',
}: SkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`bg-gray-200 rounded ${className}`}
          style={{ height }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      ))}
    </>
  );
};
