import { z } from 'zod';
import {
  bookingDate,
  earliestBookable,
  latestBookable,
} from '@/server/services/artist-availability/booking-window';
import { optionalQuery } from '../../validation';

/** The booking stub's date (L2-019), with the copy the stub shows under its date field. */
export const CheckDateRequest = z.object({
  /** Event date, `YYYY-MM-DD`, from 3 days to 18 months ahead in Toronto time. */
  date: z
    .string({ error: 'Pick your event date.' })
    .refine((value) => bookingDate(value) !== null, 'Pick your event date.')
    .refine(
      (value) => (bookingDate(value)?.toMillis() ?? 0) >= earliestBookable().toMillis(),
      'Pick a date at least 3 days away.',
    )
    .refine(
      (value) => (bookingDate(value)?.toMillis() ?? Infinity) <= latestBookable().toMillis(),
      'We take bookings up to 18 months ahead.',
    ),
});

export const ListTourDatesRequest = z.object({
  /** The search date, `YYYY-MM-DD`; the list starts 3 days from today without one. */
  from: optionalQuery(
    z.string().refine((value) => bookingDate(value) !== null, 'Pick a date as YYYY-MM-DD.'),
  ),
});

export type CheckDateRequest = z.infer<typeof CheckDateRequest>;
export type ListTourDatesRequest = z.infer<typeof ListTourDatesRequest>;
