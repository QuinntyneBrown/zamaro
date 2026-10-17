import { z } from 'zod';
import { GatheringKind, SearchSort, valuesOf } from '@/server/enums';
import {
  bookingDate,
  earliestBookable,
  latestBookable,
} from '@/server/services/artist-availability/booking-window';
import { Coordinates } from '@/server/services/discovery/coordinates';
import type { SearchCriteria } from '@/server/services/discovery/lineup';
import { cityHall } from '@/server/services/discovery/service-area';
import { optionalQuery } from '../../validation';
import { RADII_KM } from '../discovery/search-artists';

/** Without a carried radius, the Discover default. */
export const DEFAULT_RADIUS_KM = 120;

/**
 * The profile, with the Discover search it was opened from. The search only matters when the
 * artist is missing: it picks the similar artists (L2-021.1). A stale date is not an error, so an
 * old link still opens the profile.
 */
export const ShowArtistProfileRequest = z.object({
  /** The search date, `YYYY-MM-DD`; outside the booking window, the first bookable day is used. */
  date: optionalQuery(
    z.string().refine((value) => bookingDate(value) !== null, 'Pick your event date.'),
  ),
  kind: optionalQuery(z.enum(valuesOf(GatheringKind))),
  /** The search location; without both coordinates, Toronto City Hall. */
  lat: optionalQuery(z.coerce.number().min(-90).max(90)),
  lng: optionalQuery(z.coerce.number().min(-180).max(180)),
  /** Driving radius in kilometres; 120 by default. */
  radius: optionalQuery(
    z.coerce.number().refine((value) => (RADII_KM as readonly number[]).includes(value)),
  ),
});

export type ShowArtistProfileRequest = z.infer<typeof ShowArtistProfileRequest>;

/** The carried search, with Toronto, the first bookable day and 120 km for what is missing. */
export function carriedSearch(input: ShowArtistProfileRequest): SearchCriteria {
  const date = input.date === undefined ? null : bookingDate(input.date);
  const inWindow = date !== null && date >= earliestBookable() && date <= latestBookable();
  return {
    eventDate: inWindow ? date : earliestBookable(),
    kind: input.kind ?? GatheringKind.SundayService,
    location:
      input.lat !== undefined && input.lng !== undefined
        ? new Coordinates(input.lat, input.lng)
        : cityHall(),
    radiusKm: input.radius ?? DEFAULT_RADIUS_KM,
    sort: SearchSort.Closest,
    filter: { styles: [], under800: false },
  };
}
