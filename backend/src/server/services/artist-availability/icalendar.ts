import type { DateTime } from 'luxon';

/** One booking as the feed lists it (L2-058.1). */
export interface FeedEvent {
  /** The booking number, which the UID is made of. */
  uid: string;
  /** `YYYY-MM-DD`, in Toronto. */
  date: string;
  /** `HH:MM` Toronto time, or null for an all-day event (ADR-0032). */
  startTime: string | null;
  summary: string;
  location: string;
  description: string;
}

/** How long a booking with a start time runs in the feed (ADR-0032). */
export const EVENT_HOURS = 2;

const ZONE = 'America/Toronto';
const LINE_LIMIT = 75;

/** Eastern time as RFC 5545 wants it spelled out, so every calendar application reads the same hours. */
const TORONTO_TIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${ZONE}`,
  'BEGIN:STANDARD',
  'DTSTART:19701101T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
  'TZOFFSETFROM:-0400',
  'TZOFFSETTO:-0500',
  'TZNAME:EST',
  'END:STANDARD',
  'BEGIN:DAYLIGHT',
  'DTSTART:19700308T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
  'TZOFFSETFROM:-0500',
  'TZOFFSETTO:-0400',
  'TZNAME:EDT',
  'END:DAYLIGHT',
  'END:VTIMEZONE',
];

/**
 * Writes an iCalendar document (RFC 5545) by hand: a VCALENDAR with the Toronto VTIMEZONE and one
 * VEVENT per booking, lines folded at 75 octets and text escaped. Hand-written rather than a library
 * because the feed needs a dozen properties and nothing else (ADR-0032).
 */
export function writeCalendar(name: string, events: readonly FeedEvent[], stamp: DateTime): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Zamaro//Calendar feed//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(name)}`,
    `X-WR-TIMEZONE:${ZONE}`,
    ...TORONTO_TIMEZONE,
  ];
  const dtstamp = stamp.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
  for (const event of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}@zamaro.ca`,
      `DTSTAMP:${dtstamp}`,
      ...when(event),
      `SUMMARY:${escapeText(event.summary)}`,
      `LOCATION:${escapeText(event.location)}`,
      `DESCRIPTION:${escapeText(event.description)}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** All day without a start time; otherwise two hours from the start, in Toronto time. */
function when(event: FeedEvent): string[] {
  const day = event.date.replaceAll('-', '');
  if (event.startTime === null) {
    return [`DTSTART;VALUE=DATE:${day}`, `DTEND;VALUE=DATE:${nextDay(event.date)}`];
  }
  const [hours = 0, minutes = 0] = event.startTime.split(':').map(Number);
  const start = `${day}T${pad(hours)}${pad(minutes)}00`;
  const endHours = hours + EVENT_HOURS;
  const end =
    endHours >= 24
      ? `${nextDay(event.date)}T${pad(endHours - 24)}${pad(minutes)}00`
      : `${day}T${pad(endHours)}${pad(minutes)}00`;
  return [`DTSTART;TZID=${ZONE}:${start}`, `DTEND;TZID=${ZONE}:${end}`];
}

function nextDay(date: string): string {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10).replaceAll('-', '');
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Backslashes, semicolons, commas and newlines are escaped in text values (RFC 5545 §3.3.11). */
export function escapeText(text: string): string {
  return text
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll(/\r?\n/g, '\\n');
}

/** Lines longer than 75 octets continue on the next line after a space (RFC 5545 §3.1). */
export function fold(line: string): string {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= LINE_LIMIT) return line;
  const parts: string[] = [];
  let start = 0;
  let limit = LINE_LIMIT;
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Never split a multi-byte character: back up to the start of one.
    while (end < bytes.length && ((bytes[end] ?? 0) & 0xc0) === 0x80) end -= 1;
    parts.push(bytes.subarray(start, end).toString('utf8'));
    start = end;
    limit = LINE_LIMIT - 1;
  }
  return parts.join('\r\n ');
}
