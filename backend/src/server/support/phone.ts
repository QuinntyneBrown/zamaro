/**
 * A North American (NANP) phone number (L2-024.1, L2-025.4): ten digits, with or without a leading 1
 * and any spaces, dots, dashes or brackets, whose area code and exchange do not start with 0 or 1.
 * Stored in E.164 and shown as "905-555-0123".
 */
export const PHONE_MESSAGE = 'Enter a North American phone number, like 905-555-0123.';

/** "+19055550123", or null when the value is not a North American number. */
export function toE164(value: string): string | null {
  const digits = nationalDigits(value);
  return digits === null ? null : `+1${digits}`;
}

/** "905-555-0123" from a stored E.164 number. */
export function formatPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '').slice(-10);
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function isNorthAmericanPhone(value: string): boolean {
  return nationalDigits(value) !== null;
}

/** The ten national digits, or null. */
function nationalDigits(value: string): string | null {
  if (/[^\d\s().+-]/.test(value)) return null;
  let digits = value.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(digits) ? digits : null;
}
