import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { type CalendarDate, torontoToday, toUtc } from './calendar-date';

const LOCALE = 'en-CA';

/**
 * Display formats (L2-110), ordered by catalogue patterns so a new locale needs no code change:
 * "Sat 14 Nov" (year added outside the current year), "$1,800" / "$162.50", "44 km",
 * "about 44 km", "Under 1 km".
 */
@Injectable({ providedIn: 'root' })
export class FormatService {
  private readonly transloco = inject(TranslocoService);

  shortDate(date: CalendarDate): string {
    const parts = this.parts(date, { weekday: 'short', day: 'numeric', month: 'short' });
    const sameYear = date.slice(0, 4) === torontoToday().slice(0, 4);
    return sameYear
      ? this.transloco.translate('common.format.date.short', parts)
      : this.transloco.translate('common.format.date.shortWithYear', {
          ...parts,
          year: date.slice(0, 4),
        });
  }

  /** "Thu 8 Oct 2026": the short date with its year, whatever the year. */
  shortDateWithYear(date: CalendarDate): string {
    const parts = this.parts(date, { weekday: 'short', day: 'numeric', month: 'short' });
    return this.transloco.translate('common.format.date.shortWithYear', {
      ...parts,
      year: date.slice(0, 4),
    });
  }

  /**
   * A named day when the date has one ("Christmas Eve"), otherwise the short date. The names are
   * catalogue keys `common.namedDay.{MM-DD}`.
   */
  dateDescription(date: CalendarDate): string {
    const key = `common.namedDay.${date.slice(5)}`;
    const named = key in this.transloco.getTranslation(this.transloco.getActiveLang());
    return named ? this.transloco.translate(key) : this.shortDate(date);
  }

  /** "Saturday 14 November 2026". */
  longDate(date: CalendarDate): string {
    return this.transloco.translate(
      'common.format.date.long',
      this.parts(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    );
  }

  /** "September 2026", from a `YYYY-MM` month. */
  monthYear(month: string): string {
    return this.transloco.translate(
      'common.format.date.monthYear',
      this.parts(`${month}-01` as CalendarDate, { month: 'long', year: 'numeric' }),
    );
  }

  /** A date as a tour-date stamp, the weekday over the day: `{ weekday: 'Sat', day: '14 Nov' }`. */
  dayStamp(date: CalendarDate): { weekday: string; day: string } {
    const parts = this.parts(date, { weekday: 'short', day: 'numeric', month: 'short' });
    return {
      weekday: parts['weekday'],
      day: this.transloco.translate('common.format.date.dayMonth', parts),
    };
  }

  /** "Saturday". */
  weekday(date: CalendarDate): string {
    return this.parts(date, { weekday: 'long' })['weekday'];
  }

  /** "10:57 a.m.", in Toronto, from an ISO time. */
  time(instant: string): string {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat(LOCALE, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Toronto',
      })
        .formatToParts(new Date(instant))
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value]),
    );
    return this.transloco.translate('common.format.time', parts);
  }

  /**
   * How long ago an instant was, for "Last active …" (L2-110): "just now" within a minute, "12 min
   * ago", "2 hours ago" within a day, then the short date ("Tue 6 Oct").
   */
  ago(instant: string, now: Date = new Date()): string {
    const minutes = Math.floor((now.getTime() - new Date(instant).getTime()) / 60_000);
    if (minutes < 1) return this.transloco.translate('common.format.ago.now');
    if (minutes < 60)
      return this.transloco.translate('common.format.ago.minutes', { count: minutes });
    if (minutes < 24 * 60) {
      return this.transloco.translate('common.format.ago.hours', {
        count: Math.floor(minutes / 60),
      });
    }
    return this.shortDate(torontoToday(new Date(instant)));
  }

  money(cents: number): string {
    const whole = cents % 100 === 0;
    return new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency: 'CAD',
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  }

  distance(km: number, approximate = false): string {
    if (km < 1) {
      return this.transloco.translate('common.format.distance.under1');
    }
    return this.transloco.translate(
      approximate ? 'common.format.distance.about' : 'common.format.distance.km',
      { km },
    );
  }

  private parts(date: CalendarDate, options: Intl.DateTimeFormatOptions): Record<string, string> {
    return Object.fromEntries(
      new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: 'UTC' })
        .formatToParts(toUtc(date))
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value]),
    );
  }
}
