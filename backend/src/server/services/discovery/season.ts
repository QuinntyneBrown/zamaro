import type { DateTime } from 'luxon';

/** Seasons as L2-006 counts them, in Toronto time. */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export function seasonOf(date: DateTime): Season {
  if (date.month >= 3 && date.month <= 5) return 'spring';
  if (date.month >= 6 && date.month <= 8) return 'summer';
  if (date.month >= 9 && date.month <= 11) return 'autumn';
  return 'winter';
}

/** Midnight on the first day of the season `date` falls in (1 Dec for a February date). */
export function seasonStart(date: DateTime): DateTime {
  const firstMonth = { spring: 3, summer: 6, autumn: 9, winter: 12 }[seasonOf(date)];
  const year = firstMonth === 12 && date.month < 12 ? date.year - 1 : date.year;
  return date.set({
    year,
    month: firstMonth,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
}
