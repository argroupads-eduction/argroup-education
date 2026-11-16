/** Letters only; single spaces or hyphens between words; no digits. */
export const CITY_NAME_REGEX = /^[A-Za-z]+(?:[\s-][A-Za-z]+)*$/;

export const CITY_NAME_ERROR =
  'City can only contain letters (no numbers or special characters).';

export function validateCityName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Enter your city';
  if (trimmed.length < 2) return 'City name must be at least 2 characters.';
  if (!CITY_NAME_REGEX.test(trimmed)) return CITY_NAME_ERROR;
  return null;
}

/** Strip digits while typing so city fields stay name-only. */
export function sanitizeCityInput(raw: string): string {
  return raw.replace(/[0-9]/g, '');
}
