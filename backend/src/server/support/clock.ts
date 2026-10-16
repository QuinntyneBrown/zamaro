import { DateTime } from 'luxon';
import { config } from '@config/zamaro';

export const ZONE = 'America/Toronto';

/**
 * "Now" in Toronto (ADR-0027: Luxon). Test environments freeze it with ZAMARO_FROZEN_NOW, so the
 * cast's calendar reads as the mocks show it; production never reaches a frozen clock.
 */
export function now(): DateTime {
  const frozen = config().frozenNow;
  if (frozen !== undefined && config().env !== 'production') {
    return DateTime.fromISO(frozen, { setZone: true }).setZone(ZONE);
  }
  return DateTime.now().setZone(ZONE);
}

/** Today's date in Toronto as `YYYY-MM-DD`. */
export function today(): string {
  return now().toISODate() ?? '';
}

/** A Toronto wall-clock time ("2026-09-08 14:00") as an instant. */
export function torontoTime(local: string): Date {
  const parsed = DateTime.fromSQL(local, { zone: ZONE });
  if (!parsed.isValid) throw new Error(`Not a Toronto time: ${local}`);
  return parsed.toJSDate();
}
