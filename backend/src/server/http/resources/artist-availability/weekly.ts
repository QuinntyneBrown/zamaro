import { z } from 'zod';

export const WeeklyAvailabilityResource = z.object({
  data: z.object({
    /** ISO weekdays (1 is Monday) the artist is unavailable, ascending. */
    unavailableWeekdays: z.array(z.number().int().min(1).max(7)),
  }),
});
