'use client';

import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import clsx from 'clsx';

interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: string;
  variant?: 'default' | 'premium';
}

export const Accordion = ({ items, defaultOpen, variant = 'premium' }: AccordionProps) => {
  const [openId, setOpenId] = useState<string | null>(defaultOpen || null);

  if (variant === 'default') {
    return (
      <div className="space-y-4">
        {items.map((item) => (
          <AccordionRow
            key={item.id}
            item={item}
            isOpen={openId === item.id}
            onToggle={() => setOpenId(openId === item.id ? null : item.id)}
            premium={false}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="site-premium-faq-group flex flex-col gap-3">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: index * 0.05 }}
          viewport={{ once: true, margin: '-40px' }}
        >
          <AccordionRow
            item={item}
            isOpen={openId === item.id}
            onToggle={() => setOpenId(openId === item.id ? null : item.id)}
            premium
          />
        </motion.div>
      ))}
    </div>
  );
};

function AccordionRow({
  item,
  isOpen,
  onToggle,
  premium,
}: {
  item: AccordionItem;
  isOpen: boolean;
  onToggle: () => void;
  premium: boolean;
}) {
  return (
    <div
      className={clsx(
        'overflow-hidden transition-all duration-300',
        premium
          ? clsx(
              'rounded-2xl border bg-gradient-to-br from-white to-slate-50/90 shadow-sm',
              isOpen
                ? 'border-gold-400/55 shadow-[0_10px_28px_rgba(12,31,63,0.08)] ring-1 ring-gold-400/20'
                : 'border-navy-900/10 hover:border-gold-400/35 hover:shadow-md'
            )
          : 'rounded-lg border border-gray-200'
      )}
      style={premium && isOpen ? { boxShadow: 'inset 4px 0 0 rgb(245 158 11), 0 10px 28px rgba(12,31,63,0.08)' } : undefined}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={clsx(
          'flex w-full items-center justify-between gap-4 text-left transition-colors',
          premium ? 'px-5 py-4 md:px-6 md:py-[1.1rem]' : 'bg-white px-6 py-4 hover:bg-gray-50'
        )}
      >
        <span
          className={clsx(
            'font-bold leading-snug',
            premium ? 'text-base text-navy-900 md:text-[1.02rem]' : 'font-semibold text-navy-900'
          )}
        >
          {item.title}
        </span>
        <span
          className={clsx(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all duration-300',
            isOpen
              ? 'rotate-180 border-gold-400/50 bg-gold-50 text-gold-600'
              : 'border-slate-200 bg-white text-navy-800'
          )}
          aria-hidden
        >
          <svg viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current stroke-[2.5]">
            <path d="M2 4.5 L6 8.5 L10 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div
              className={clsx(
                'border-t text-sm leading-relaxed md:text-[0.95rem]',
                premium
                  ? 'border-gold-200/40 bg-slate-50/80 px-5 py-4 text-slate-600 md:px-6 md:py-5'
                  : 'border-gray-200 bg-gray-50 px-6 py-4 text-gray-700'
              )}
            >
              {item.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
