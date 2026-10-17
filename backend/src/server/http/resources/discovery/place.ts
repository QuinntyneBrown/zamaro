import { z } from 'zod';

/** The centre point of a typed town or a quick-pick city, for the Discover location field (L2-004.6). */
export const PlaceResource = z.object({
  data: z.object({
    /** What the location field shows, e.g. "Burlington, ON". */
    label: z.string(),
    city: z.string(),
    lat: z.number(),
    lng: z.number(),
  }),
});

export type PlaceResource = z.infer<typeof PlaceResource>;
