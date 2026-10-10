/** Every date rule is evaluated in Toronto (docs/specs/L2.md conventions). */
export const TIME_ZONE = 'America/Toronto';

/** A calendar date as `YYYY-MM-DD`. */
export type CalendarDate = string;

/** Today's date in Toronto. */
export function torontoToday(now: Date = new Date()): CalendarDate {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  const utc = toUtc(date);
  utc.setUTCDate(utc.getUTCDate() + days);
  return fromUtc(utc);
}

/** Adds months, clamping to the last day of a shorter month (31 Aug + 18 months = 28 Feb). */
export function addMonths(date: CalendarDate, months: number): CalendarDate {
  const [year, month, day] = date.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return fromUtc(target);
}

/** Midnight UTC on the date, for formatting it with `timeZone: 'UTC'` without a day shift. */
export function toUtc(date: CalendarDate): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function fromUtc(date: Date): CalendarDate {
  return date.toISOString().slice(0, 10);
}
