import type { DateTime } from 'luxon';
import { tourDays, type TourDate } from '@/server/services/artist-availability/availability';
import {
  earliestBookable,
  latestBookable,
} from '@/server/services/artist-availability/booking-window';
import { resolveArtistSlug } from '@/server/services/artist-profiles/resolve-artist-slug';

export const TOUR_DATES_LIMIT = 6;

/**
 * A visible artist's "On tour" list (L2-017): the next 6 free or booked dates from the search date,
 * or from 3 days from today when there is none, up to the end of the booking window.
 */
export async function listTourDates(slug: string, from: DateTime | null): Promise<TourDate[]> {
  const artist = await resolveArtistSlug(slug);
  // A search date sooner than the window cannot be booked, so the list starts where it can.
  const earliest = earliestBookable();
  const start = from === null || from < earliest ? earliest : from;
  const dates: TourDate[] = [];
  for await (const date of tourDays(artist.id, start, latestBookable())) {
    dates.push(date);
    if (dates.length === TOUR_DATES_LIMIT) break;
  }
  return dates;
}
