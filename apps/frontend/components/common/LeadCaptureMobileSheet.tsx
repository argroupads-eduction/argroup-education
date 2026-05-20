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
 * Mobile lead capture: compact bottom sheet / card (max 90dvh), overflow hidden —
 * no nested scroll regions so the full form stays visible on one screen.
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
        hidden: { opacity: 0, y: 24 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { type: 'spring' as const, stiffness: 420, damping: 34 },
        },
      };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[100] bg-navy-950/75 backdrop-blur-sm"
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
                className="fixed inset-0 z-[101] flex items-end justify-center px-0 pb-0 pt-[max(0.5rem,env(safe-area-inset-top,0px))] sm:items-center sm:p-4"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={sheetVariants}
              >
                <div className="relative flex max-h-[90dvh] w-full max-w-md min-h-0 flex-col overflow-hidden rounded-t-2xl border border-navy-200/20 bg-white shadow-2xl shadow-navy-900/30 sm:max-h-[min(90dvh,40rem)] sm:rounded-2xl">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-navy-900/40 text-white backdrop-blur-sm transition-colors hover:bg-navy-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 touch-manipulation"
                      aria-label="Close lead form"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </Dialog.Close>

                  <div className="shrink-0 overflow-hidden">{header}</div>

                  <div className="flex min-h-0 shrink flex-col overflow-hidden">{children}</div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
