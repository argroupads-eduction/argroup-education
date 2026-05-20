'use client';

import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export type LeadCaptureMobileSheetProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  reduceMotion: boolean;
  /** Condensed branding — keep short; capped ~28vh so the form stays usable */
  header: ReactNode;
  /** Form body: scrolls independently with touch-friendly momentum */
  children: ReactNode;
};

/**
 * Full-viewport mobile sheet: fixed outer wrapper; header region capped in height; form is the
 * primary scroll container (`flex-1 min-h-0 overflow-y-auto`) with overscroll containment so
 * the page behind does not steal gestures. Scrollbars use `.lead-capture-form-scroll` (thin
 * neutral thumb — not the global gold webkit style).
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
                className="fixed inset-0 z-[101] flex flex-col pt-[env(safe-area-inset-top,0px)]"
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

                  {/* Branding: fixed max height so the form panel is never pushed off-screen */}
                  <div className="shrink-0 max-h-[28vh] overflow-x-hidden overflow-y-auto overscroll-y-contain border-b border-slate-100 [-webkit-overflow-scrolling:touch] [overscroll-behavior-y:contain] pl-[max(0px,env(safe-area-inset-left,0px))] pr-[max(0px,env(safe-area-inset-right,0px))] pt-[max(3.25rem,calc(env(safe-area-inset-top,0px)+2.75rem))] scrollbar-thin-lead-capture">
                    {header}
                  </div>

                  {/* Form: single main scroll — sticky submit lives inside LeadCaptureFormPanel */}
                  <div className="lead-capture-form-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] [overscroll-behavior-y:contain] pl-[max(0px,env(safe-area-inset-left,0px))] pr-[max(0px,env(safe-area-inset-right,0px))] pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
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
