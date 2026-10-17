import { z } from 'zod';

/** Ways forward from a sold-out search (L2-011). */
export const AlternativesResource = z.object({
  data: z.object({
    /** Up to three dates within 7 days either side, closest first. */
    nearbyDates: z.array(z.object({ date: z.string(), count: z.number().int() })),
    /** The smallest wider radius with someone free on the date, or null. */
    widerRadius: z.object({ km: z.number().int(), count: z.number().int() }).nullable(),
    /** Whether style or price filters narrowed the search ("Show all styles"). */
    filtersApplied: z.boolean(),
  }),
});

export type AlternativesResource = z.infer<typeof AlternativesResource>;
