'use client';

import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export type LeadCaptureMobileSheetProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  reduceMotion: boolean;
  /** Compact navy branding strip — keep short; no internal scroll */
  header: ReactNode;
  /** Form body — must fit without scrolling (compact fields) */
  children: ReactNode;
};

/**
 * Mobile lead capture: compact bottom sheet (max 90dvh), overflow hidden —
 * no nested scroll so the full form stays visible on one screen.
 */
export function LeadCaptureMobileSheet({
  open,
  onOpenChange,
  reduceMotion,
  header,
  children,
}: LeadCaptureMobileSheetProps) {
  const overlayVariants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0 }, visible: { opacity: 1 } };

  const sheetVariants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 28 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { type: 'spring' as const, stiffness: 440, damping: 36 },
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
              <motion.div
                className="fixed inset-x-0 bottom-0 z-[101] flex justify-center px-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] sm:inset-0 sm:items-center sm:p-4"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={sheetVariants}
              >
                <div className="relative flex w-full max-w-md min-h-0 max-h-[min(88dvh,36rem)] flex-col overflow-hidden rounded-t-[1.35rem] border border-navy-200/25 bg-white shadow-[0_-8px_40px_rgba(26,54,93,0.22)] sm:max-h-[min(90dvh,40rem)] sm:rounded-2xl sm:shadow-2xl sm:shadow-navy-900/30">
                  <div
                    className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-300/90 sm:hidden"
                    aria-hidden
                  />

                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="absolute right-2.5 top-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-navy-900/50 text-white backdrop-blur-sm transition-colors hover:bg-navy-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 touch-manipulation sm:right-3 sm:top-3 sm:h-9 sm:w-9"
                      aria-label="Close lead form"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </Dialog.Close>

                  <div className="shrink-0 overflow-hidden bg-navy-900 text-white">{header}</div>

                  <div
                    className="h-0.5 shrink-0 bg-gradient-to-r from-transparent via-gold-400 to-transparent"
                    aria-hidden
                  />

                  <div className="flex min-h-0 shrink flex-col overflow-hidden bg-gradient-to-b from-white to-slate-50/40">
                    {children}
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
