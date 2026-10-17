import { DateTime } from 'luxon';
import { now, ZONE } from '@/server/support/clock';

/** The dates a church can book (L2-004): from 3 days to 18 months ahead, counted in Toronto. */
export function earliestBookable(): DateTime {
  return today().plus({ days: 3 });
}

export function latestBookable(): DateTime {
  return today().plus({ months: 18 });
}

/** A `YYYY-MM-DD` date as the start of that day in Toronto; invalid dates are `null`. */
export function bookingDate(date: string): DateTime | null {
  const parsed = DateTime.fromISO(date, { zone: ZONE });
  return parsed.isValid && /^\d{4}-\d{2}-\d{2}$/.test(date) ? parsed.startOf('day') : null;
}

function today(): DateTime {
  return now().startOf('day');
}
