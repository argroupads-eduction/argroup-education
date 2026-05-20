'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export type LeadCaptureMobileSheetProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  reduceMotion: boolean;
  children: React.ReactNode;
};

/**
 * Full-viewport mobile sheet: one scroll parent for promo + form (no nested scroll/clipping).
 * Scrollbar styling is neutralized via `.lead-capture-mobile-scroll` in globals.css (avoids global gold thumb).
 */
export function LeadCaptureMobileSheet({
  open,
  onOpenChange,
  reduceMotion,
  children,
}: LeadCaptureMobileSheetProps) {
  const overlayVariants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0 }, visible: { opacity: 1 } };

  const sheetVariants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 420, damping: 34 } },
      };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[100] bg-navy-950/70 backdrop-blur-sm"
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
                className="fixed inset-0 z-[101] flex flex-col"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={sheetVariants}
              >
                <div className="relative flex h-[100dvh] max-h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-white shadow-2xl shadow-navy-900/25">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="absolute right-[max(0.75rem,env(safe-area-inset-right,0px))] top-[max(0.75rem,env(safe-area-inset-top,0px))] z-20 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-navy-800 shadow-md transition-colors hover:bg-navy-50 hover:text-navy-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 touch-manipulation"
                      aria-label="Close lead form"
                    >
                      <X className="h-5 w-5" aria-hidden />
                    </button>
                  </Dialog.Close>

                  <div className="lead-capture-mobile-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pt-[max(3.5rem,calc(env(safe-area-inset-top,0px)+2.75rem))] pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pl-[max(0px,env(safe-area-inset-left,0px))] pr-[max(0px,env(safe-area-inset-right,0px))] [-webkit-overflow-scrolling:touch]">
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
