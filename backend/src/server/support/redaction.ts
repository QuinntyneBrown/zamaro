/**
 * Log redaction (L2-079.3, security/protect-secrets-and-data): secrets never reach a log line
 * whichever key or depth carries them, and a payment identifier or card number keeps only its last
 * four digits. Applied to every log object by the logger's formatter.
 */
export const REDACTED = '[REDACTED]';

const SECRET_KEYS = new Set([
  'password',
  'current_password',
  'password_confirmation',
  'new_password',
  'challengetoken',
  'x-xsrf-token',
  'xsrf-token',
  'cookie',
  'set-cookie',
  'authorization',
  'remember_token',
  'session_id',
  'sessionid',
  'token',
  'secret',
  'body',
]);

const PAYMENT_KEYS = /payment_id$|^card|card_number|^pan$/i;
const CARD_NUMBER = /\b(?:\d[ -]?){12,18}\d\b/g;

export function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === 'string') return maskCardNumbers(value);
  if (value === null || typeof value !== 'object' || value instanceof Error) return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => redact(item, seen));
  if (Object.getPrototypeOf(value) !== Object.prototype && !isPlainLike(value)) return value;
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const lower = key.toLowerCase();
    if (SECRET_KEYS.has(lower)) result[key] = REDACTED;
    else if (PAYMENT_KEYS.test(key) && typeof item === 'string') result[key] = lastFour(item);
    else result[key] = redact(item, seen);
  }
  return result;
}

/** `pi_3NxK2a8842` → `…8842`. */
function lastFour(value: string): string {
  return `…${value.slice(-4)}`;
}

function maskCardNumbers(text: string): string {
  return text.replace(CARD_NUMBER, (match) => lastFour(match.replace(/\D/g, '')));
}

function isPlainLike(value: object): boolean {
  return Object.getPrototypeOf(value) === null;
}
