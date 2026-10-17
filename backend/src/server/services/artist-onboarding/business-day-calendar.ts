import { DateTime } from 'luxon';
import { ZONE } from '@/server/support/clock';

/**
 * Business days in Ontario (L2-047.4): weekdays that are not statutory holidays. A holiday that
 * falls on a weekend is observed on the next weekday, as employers do. Shared with payouts (M7).
 */
export interface Holiday {
  /** `YYYY-MM-DD`, as observed. */
  date: string;
  name: string;
}

/** The date `days` business days after `from`, counting from the next business day, at midnight in Toronto. */
export function businessDaysAfter(from: DateTime, days: number): DateTime {
  let date = from.setZone(ZONE).startOf('day');
  let remaining = days;
  while (remaining > 0) {
    date = date.plus({ days: 1 });
    if (isBusinessDay(date)) remaining--;
  }
  return date;
}

export function isBusinessDay(date: DateTime): boolean {
  const day = date.setZone(ZONE);
  if (day.weekday >= 6) return false;
  const iso = day.toISODate() ?? '';
  return !holidays(day.year).some((holiday) => holiday.date === iso);
}

/** The holidays skipped between `from` (exclusive) and `until` (inclusive): the ones the page names. */
export function holidaysBetween(from: DateTime, until: DateTime): Holiday[] {
  const start = from.setZone(ZONE).toISODate() ?? '';
  const end = until.setZone(ZONE).toISODate() ?? '';
  const skipped: Holiday[] = [];
  for (let year = from.setZone(ZONE).year; year <= until.setZone(ZONE).year; year++) {
    for (const holiday of holidays(year)) {
      if (holiday.date > start && holiday.date <= end) skipped.push(holiday);
    }
  }
  return skipped;
}

/** Ontario's statutory holidays for a year, as observed, in date order. */
export function holidays(year: number): Holiday[] {
  const easterSunday = easter(year);
  const fixed: [string, DateTime][] = [
    ['New Year’s Day', DateTime.fromObject({ year, month: 1, day: 1 }, { zone: ZONE })],
    ['Canada Day', DateTime.fromObject({ year, month: 7, day: 1 }, { zone: ZONE })],
    ['Christmas Day', DateTime.fromObject({ year, month: 12, day: 25 }, { zone: ZONE })],
    ['Boxing Day', DateTime.fromObject({ year, month: 12, day: 26 }, { zone: ZONE })],
  ];
  const floating: [string, DateTime][] = [
    ['Good Friday', easterSunday.minus({ days: 2 })],
    ['Family Day', nthMonday(year, 2, 3)],
    ['Victoria Day', victoriaDay(year)],
    ['Labour Day', nthMonday(year, 9, 1)],
    ['Thanksgiving', nthMonday(year, 10, 2)],
  ];

  const observed = new Map<string, string>();
  for (const [name, holiday] of fixed) {
    let date = holiday;
    while (date.weekday >= 6 || observed.has(date.toISODate() ?? '')) date = date.plus({ days: 1 });
    observed.set(date.toISODate() ?? '', name);
  }
  for (const [name, holiday] of floating) observed.set(holiday.toISODate() ?? '', name);
  return [...observed.entries()]
    .map(([date, name]) => ({ date, name }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

function nthMonday(year: number, month: number, nth: number): DateTime {
  const first = DateTime.fromObject({ year, month, day: 1 }, { zone: ZONE });
  const offset = (8 - first.weekday) % 7;
  return first.plus({ days: offset + (nth - 1) * 7 });
}

/** Victoria Day: the last Monday before 25 May. */
function victoriaDay(year: number): DateTime {
  let date = DateTime.fromObject({ year, month: 5, day: 24 }, { zone: ZONE });
  while (date.weekday !== 1) date = date.minus({ days: 1 });
  return date;
}

/** Easter Sunday (Gregorian, the anonymous algorithm). */
function easter(year: number): DateTime {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return DateTime.fromObject({ year, month, day }, { zone: ZONE });
}
