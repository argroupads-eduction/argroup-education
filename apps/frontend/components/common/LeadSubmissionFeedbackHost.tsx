'use client';

import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CheckCircle2, Info, X } from 'lucide-react';
import {
  subscribeLeadSubmissionFeedback,
  type LeadSubmissionFeedbackType,
} from '@/lib/leadSubmissionFeedback';
import {
  DUPLICATE_LEAD_MESSAGE,
  SHEETS_UNAVAILABLE_MESSAGE,
  SUCCESS_LEAD_MESSAGE,
} from '@/lib/leadSubmissionMessages';

const COPY: Record<
  LeadSubmissionFeedbackType,
  { title: string; message: string; icon: typeof CheckCircle2; tone: string }
> = {
  success: {
    title: 'Submitted Successfully',
    message: SUCCESS_LEAD_MESSAGE,
    icon: CheckCircle2,
    tone: 'text-emerald-600',
  },
  duplicate: {
    title: 'Already Received',
    message: DUPLICATE_LEAD_MESSAGE,
    icon: Info,
    tone: 'text-amber-600',
  },
  error: {
    title: 'Unable to Complete',
    message: SHEETS_UNAVAILABLE_MESSAGE,
    icon: Info,
    tone: 'text-red-600',
  },
};

export function LeadSubmissionFeedbackHost() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<LeadSubmissionFeedbackType>('success');

  useEffect(() => subscribeLeadSubmissionFeedback((next) => {
    setType(next);
    setOpen(true);
  }), []);

  const copy = COPY[type];
  const Icon = copy.icon;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-navy-950/55 backdrop-blur-[2px]" />
        <Dialog.Content
          data-lead-submission-feedback
          className="fixed left-1/2 top-1/2 z-[201] w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl outline-none"
          onCloseAutoFocus={(e) => {
            // Keep focus from collapsing parent dialogs (e.g. College Predictor on mobile).
            e.preventDefault();
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Icon className={`mt-0.5 h-6 w-6 shrink-0 ${copy.tone}`} aria-hidden />
              <div>
                <Dialog.Title className="font-serif text-lg font-bold text-navy-900">
                  {copy.title}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm leading-relaxed text-slate-600">
                  {copy.message}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <div className="mt-6 flex justify-end">
            <Dialog.Close className="ui-btn ui-btn--primary ui-btn--sm">OK</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
