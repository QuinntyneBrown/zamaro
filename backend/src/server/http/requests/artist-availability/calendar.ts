import { DateTime } from 'luxon';
import { z } from 'zod';
import { calendarWindow } from '@/server/actions/artist-availability/build-artist-calendar';
import { optionalQuery } from '../../validation';

const NOT_A_MONTH = 'Pick a month.';
const OUTSIDE_WINDOW = 'The calendar runs from this month to 18 months ahead.';

/** The calendar's month, `YYYY-MM`; this month when absent (L2-056.1). */
export const ArtistCalendarRequest = z.object({
  month: optionalQuery(
    z
      .string({ error: NOT_A_MONTH })
      .refine(
        (value) => /^\d{4}-\d{2}$/.test(value) && DateTime.fromFormat(value, 'yyyy-MM').isValid,
        NOT_A_MONTH,
      )
      .refine((value) => {
        const window = calendarWindow();
        return value >= window.from && value <= window.to;
      }, OUTSIDE_WINDOW),
  ),
});
