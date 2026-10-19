import type { CalendarDate, FormatService } from 'api';

/**
 * Days as the mocks list them, the month once at the end (L2-110): "Thu 26 and Fri 27 Nov",
 * "Sat 28 or Sun 29 Nov", "Thu 19 to Sat 21 Nov" (the ends of a run), "Sat 14 Nov" alone. Days in
 * different months each keep their month.
 */
export function dayList(
  dates: readonly CalendarDate[],
  joiner: 'and' | 'or' | 'to',
  format: FormatService,
): string {
  if (dates.length === 0) return '';
  if (dates.length === 1) return format.shortDate(dates[0]);
  const picked = joiner === 'to' ? [dates[0], dates[dates.length - 1]] : [...dates];
  const last = picked[picked.length - 1];
  const sameMonth = picked.every((date) => date.slice(0, 7) === last.slice(0, 7));
  const words = picked.map((date, index) =>
    index === picked.length - 1 || !sameMonth ? format.shortDate(date) : shortDay(date, format),
  );
  const head = words.slice(0, -1).join(', ');
  return `${head} ${joiner} ${words[words.length - 1]}`;
}

/** "26–27 Nov", "26 Nov – 2 Dec" or "26 Nov": the ends of a run without weekdays. */
export function dayRange(from: CalendarDate, to: CalendarDate, format: FormatService): string {
  const fromStamp = format.dayStamp(from).day;
  const toStamp = format.dayStamp(to).day;
  if (from === to) return fromStamp;
  return from.slice(0, 7) === to.slice(0, 7)
    ? `${Number(from.slice(8))}–${toStamp}`
    : `${fromStamp} – ${toStamp}`;
}

/** "Sat 28": the weekday and day without the month. */
export function shortDay(date: CalendarDate, format: FormatService): string {
  return `${format.dayStamp(date).weekday} ${Number(date.slice(8))}`;
}
