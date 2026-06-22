import { showLeadSubmissionFeedback } from '@/lib/leadSubmissionFeedback';

/** Show the standard success / duplicate / error popup from an API response. */
export function notifyLeadSubmissionFromResponse(
  res: Response,
  json?: { duplicate?: boolean }
): void {
  if (res.status === 409 || json?.duplicate) {
    showLeadSubmissionFeedback('duplicate');
    return;
  }
  if (!res.ok) {
    showLeadSubmissionFeedback('error');
    return;
  }
  showLeadSubmissionFeedback('success');
}
