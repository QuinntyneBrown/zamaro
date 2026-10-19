import { z } from 'zod';
import { OverrideState, valuesOf } from '@/server/enums';
import { bookingDate, latestBookable } from '@/server/services/artist-availability/booking-window';
import { now } from '@/server/support/clock';

/**
 * A range of dates to mark unavailable or free (L2-056.3, L2-075): both ends `YYYY-MM-DD`, today
 * or later and no later than the last bookable date, the first no later than the last; an optional
 * private note of up to 100 characters; `confirm` once the artist has seen the warning.
 */
export const SetDateAvailabilityRequest = z
  .object({
    from: z
      .string({ error: 'Pick the first day.' })
      .refine((value) => bookingDate(value) !== null, 'Pick the first day.')
      .refine(
        (value) => (bookingDate(value)?.toMillis() ?? 0) >= now().startOf('day').toMillis(),
        'Pick today or a later day.',
      )
      .refine(
        (value) => (bookingDate(value)?.toMillis() ?? Infinity) <= latestBookable().toMillis(),
        'The calendar runs 18 months ahead.',
      ),
    to: z
      .string({ error: 'Pick the last day.' })
      .refine((value) => bookingDate(value) !== null, 'Pick the last day.')
      .refine(
        (value) => (bookingDate(value)?.toMillis() ?? Infinity) <= latestBookable().toMillis(),
        'The calendar runs 18 months ahead.',
      ),
    state: z.enum(valuesOf(OverrideState), { error: 'Pick unavailable or free.' }),
    note: z
      .string()
      .max(100, 'Keep the note to 100 characters.')
      .nullish()
      .transform((value) =>
        value === undefined || value === null || value.trim() === '' ? null : value,
      ),
    confirm: z.boolean().default(false),
  })
  .check((context) => {
    const { from, to } = context.value;
    if ((bookingDate(to)?.toMillis() ?? 0) < (bookingDate(from)?.toMillis() ?? 0)) {
      context.issues.push({
        code: 'custom',
        path: ['to'],
        message: 'The last day comes after the first.',
        input: to,
      });
    }
  });
