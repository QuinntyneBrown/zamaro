import { DateTime } from 'luxon';
import { reloadConfig } from '@config/zamaro';
import { now, ZONE } from '@/server/support/clock';

/** Freezes the API's clock at a Toronto time ("2026-10-09 10:00"). */
export function travelTo(local: string): void {
  const at = DateTime.fromSQL(local, { zone: ZONE });
  if (!at.isValid) throw new Error(`Not a Toronto time: ${local}`);
  process.env.ZAMARO_FROZEN_NOW = at.toISO() ?? '';
  reloadConfig();
}

/** Moves the frozen clock forward. */
export function travel(by: { days?: number; seconds?: number; minutes?: number }): void {
  process.env.ZAMARO_FROZEN_NOW = now().plus(by).toISO() ?? '';
  reloadConfig();
}

/** Back to the mocks' today, Fri 9 Oct 2026 at 10:00. */
export function resetClock(): void {
  travelTo('2026-10-09 10:00:00');
}
