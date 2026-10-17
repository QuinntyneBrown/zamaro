import { z } from 'zod';
import { GatheringKind, TourDateStatus, valuesOf } from '@/server/enums';

/**
 * One "On tour" row (L2-017). A booked date carries only the kind of gathering and the church's city,
 * never the church, its address, the booker or the booking number (L2-083).
 */
export const TourDatesResource = z.object({
  data: z.array(
    z.object({
      /** `YYYY-MM-DD`. */
      date: z.string(),
      status: z.enum(valuesOf(TourDateStatus)),
      /** The booked gathering's kind; null on a free date. */
      kind: z.enum(valuesOf(GatheringKind)).nullable(),
      /** The booked church's city; null on a free date. */
      city: z.string().nullable(),
    }),
  ),
});

/** Whether the artist is free on one date, for the booking stub (L2-019). */
export const AvailabilityResource = z.object({
  data: z.object({
    /** `YYYY-MM-DD`, as asked. */
    date: z.string(),
    free: z.boolean(),
    /** On a free date, the last day a booking on it could be cancelled for free (L2-044); otherwise null. */
    freeCancellationUntil: z.string().nullable(),
  }),
});

/** Every published profile and when it last changed, for `/sitemap.xml` (L2-112.3). */
export const SitemapResource = z.object({
  data: z.array(
    z.object({
      slug: z.string(),
      /** `YYYY-MM-DD`, the day the artist's record last changed. */
      lastModified: z.string(),
    }),
  ),
});

export type TourDatesResource = z.infer<typeof TourDatesResource>;
export type AvailabilityResource = z.infer<typeof AvailabilityResource>;
export type SitemapResource = z.infer<typeof SitemapResource>;
