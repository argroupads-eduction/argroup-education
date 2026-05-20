'use client';

import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export type LeadCaptureMobileSheetProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  reduceMotion: boolean;
  /** Radix dialog title (aria-labelledby); visible copy may live in `header` */
  title?: string;
  /** Compact navy branding strip — keep short; no internal scroll */
  header: ReactNode;
  /** Form body — must fit without scrolling (compact fields) */
  children: ReactNode;
};

/**
 * Mobile-only lead capture: centered card modal (max ~88dvh), overflow hidden —
 * no nested scroll so the full form stays visible on one screen.
 */
const DEFAULT_TITLE = 'MBBS abroad experts';

export function LeadCaptureMobileSheet({
  open,
  onOpenChange,
  reduceMotion,
  title = DEFAULT_TITLE,
  header,
  children,
}: LeadCaptureMobileSheetProps) {
  const overlayVariants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0 }, visible: { opacity: 1 } };

  const sheetVariants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 28, scale: 0.94 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: 'spring' as const, stiffness: 420, damping: 34, mass: 0.85 },
        },
      };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[100] bg-navy-900/80 backdrop-blur-[3px]"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={overlayVariants}
                transition={{ duration: reduceMotion ? 0 : 0.22 }}
              />
            </Dialog.Overlay>

            <Dialog.Content
              asChild
              forceMount
              aria-labelledby="lead-capture-title"
              aria-describedby="lead-capture-desc"
            >
              <div className="fixed inset-0 z-[101] flex items-center justify-center px-4 py-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
                <motion.div
                  className="relative flex w-full max-w-[min(100%,22.5rem)] min-h-0 max-h-[min(88dvh,36rem)] flex-col overflow-hidden rounded-2xl border border-navy-200/20 bg-white shadow-2xl shadow-navy-900/35 ring-1 ring-navy-900/5"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={sheetVariants}
                >
                  <Dialog.Title id="lead-capture-title" className="sr-only">
                    {title}
                  </Dialog.Title>

                  <div className="relative shrink-0 overflow-hidden bg-navy-900 text-white">
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-navy-800/90 text-white transition-colors hover:border-white/35 hover:bg-navy-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 touch-manipulation"
                        aria-label="Close lead form"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </Dialog.Close>
                    {header}
                  </div>

                  <div
                    className="h-0.5 shrink-0 bg-gradient-to-r from-transparent via-gold-400 to-transparent"
                    aria-hidden
                  />

                  <div className="flex min-h-0 shrink flex-col overflow-hidden bg-gradient-to-b from-white to-slate-50/40">
                    {children}
                  </div>
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
