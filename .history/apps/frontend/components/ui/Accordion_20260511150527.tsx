'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItem {
  id: string;
  title: string;
  content: string;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: string;
}

export const Accordion = ({ items, defaultOpen }: AccordionProps) => {
  const [openId, setOpenId] = useState<string | null>(defaultOpen || null);

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <motion.div
          key={item.id}
          className="border border-gray-200 rounded-lg overflow-hidden"
          layout
        >
          <button
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
            className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-navy-900 text-left">
              {item.title}
            </span>
            <motion.div
              animate={{ rotate: openId === item.id ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-gold-500" />
            </motion.div>
          </button>
          <AnimatePresence>
            {openId === item.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-6 py-4 bg-gray-50 text-gray-700 border-t border-gray-200">
                  {item.content}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};
