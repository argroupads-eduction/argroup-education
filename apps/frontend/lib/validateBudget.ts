/**
 * Budget field for lead/counselling forms (not Rank/College predictors).
 * Digits only; minimum 3 digits.
 */

export const BUDGET_MIN_DIGITS = 3;
export const BUDGET_MAX_DIGITS = 12;

export function sanitizeBudgetInput(raw: string): string {
  return String(raw ?? '')
    .replace(/\D/g, '')
    .slice(0, BUDGET_MAX_DIGITS);
}

export function validateBudget(raw: string): string | null {
  const digits = sanitizeBudgetInput(raw);
  if (!digits) return 'Budget is required.';
  if (digits.length < BUDGET_MIN_DIGITS) {
    return `Budget must be at least ${BUDGET_MIN_DIGITS} digits.`;
  }
  return null;
}

/** Zod-friendly refine helper for react-hook-form schemas. */
export function isValidBudgetDigits(raw: string): boolean {
  return validateBudget(raw) === null;
}
