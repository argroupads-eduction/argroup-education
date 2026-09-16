'use client';

export type LeadSubmissionFeedbackType = 'success' | 'duplicate' | 'error';

type Listener = (type: LeadSubmissionFeedbackType) => void;

let listener: Listener | null = null;

export function subscribeLeadSubmissionFeedback(fn: Listener): () => void {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

export function showLeadSubmissionFeedback(type: LeadSubmissionFeedbackType): void {
  listener?.(type);
}
