import { z } from 'zod';

export const LOCATION_MISSING = 'Enter your church’s address or town, or pick a city below.';

/** A town or address, e.g. "Burlington, ON". */
export const LookUpPlaceRequest = z.object({
  q: z
    .string({ error: LOCATION_MISSING })
    .trim()
    .min(1, LOCATION_MISSING)
    .max(200, 'Use at most 200 characters.'),
});

export type LookUpPlaceRequest = z.infer<typeof LookUpPlaceRequest>;
