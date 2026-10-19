import { z } from 'zod';

export const DateRangeResource = z.object({
  data: z.object({
    /** The dates saved, in order. */
    changedDates: z.array(z.iso.date()),
    /** Confirmed dates in the range, which stay Booked. */
    skippedDates: z.array(z.iso.date()),
    /** Open requests declined because the artist confirmed. */
    declinedCount: z.number().int(),
  }),
});
