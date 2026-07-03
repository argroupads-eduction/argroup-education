'use client';

import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

export type LeadCaptureMobileSheetProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  reduceMotion: boolean;
  /** Radix dialog title (aria-labelledby); visible copy may live in `header` */
  title?: string;
  /** Compact navy branding strip, keep short; no internal scroll */
  header: ReactNode;
  /** Form body — scrollable when OTP / keyboard add height */
  children: ReactNode;
};

/**
 * Mobile / tablet lead capture: centered card modal (max ~92dvh), body scrolls when needed.
 */
const DEFAULT_TITLE = 'MBBS in India or abroad, expert counselling';

export function LeadCaptureMobileSheet({
  open,
  onOpenChange,
  reduceMotion,
  title = DEFAULT_TITLE,
  header,
  children,
}: LeadCaptureMobileSheetProps) {
  const prefersReducedMotion = useReducedMotion();
  const motionOff = reduceMotion || prefersReducedMotion;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-navy-900/80 backdrop-blur-[3px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          className="fixed inset-0 z-[101] flex items-center justify-center border-0 bg-transparent px-4 py-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-none outline-none focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <Dialog.Description className="sr-only">
            AR Group MBBS counselling for India and abroad, enter your details for a callback.
          </Dialog.Description>

          <motion.div
            className="relative flex w-full max-w-[min(100%,22.5rem)] min-h-0 max-h-[min(92dvh,40rem)] flex-col overflow-hidden rounded-2xl border border-navy-200/20 bg-white shadow-2xl shadow-navy-900/35 ring-1 ring-navy-900/5 sm:max-w-[min(100%,28rem)] md:max-h-[min(90dvh,42rem)]"
            initial={motionOff ? false : { opacity: 0, y: 28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={
              motionOff
                ? { duration: 0 }
                : { type: 'spring', stiffness: 420, damping: 34, mass: 0.85 }
            }
          >
            <div className="relative shrink-0 overflow-hidden bg-navy-900 text-white">
              <div className="flex justify-end px-3 pt-2.5">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-navy-800/90 text-white transition-colors hover:border-white/35 hover:bg-navy-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 touch-manipulation"
                    aria-label="Close lead form"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </Dialog.Close>
              </div>
              {header}
            </div>

            <div
              className="h-0.5 shrink-0 bg-gradient-to-r from-transparent via-gold-400 to-transparent"
              aria-hidden
            />

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain bg-gradient-to-b from-white to-slate-50/40 [-webkit-overflow-scrolling:touch]">
              {children}
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
