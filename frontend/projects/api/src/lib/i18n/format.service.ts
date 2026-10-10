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

  /** "Saturday 14 November 2026". */
  longDate(date: CalendarDate): string {
    return this.transloco.translate(
      'common.format.date.long',
      this.parts(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    );
  }

  /** "Saturday". */
  weekday(date: CalendarDate): string {
    return this.parts(date, { weekday: 'long' })['weekday'];
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
