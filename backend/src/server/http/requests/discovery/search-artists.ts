import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { GatheringKind, SearchSort, Style, valuesOf } from '@/server/enums';
import {
  bookingDate,
  earliestBookable,
  latestBookable,
} from '@/server/services/artist-availability/booking-window';
import { Coordinates } from '@/server/services/discovery/coordinates';
import type { SearchCriteria } from '@/server/services/discovery/lineup';
import { decodeCursor } from '@/server/services/discovery/page-cursor';
import { serviceAreaContains } from '@/server/services/discovery/service-area';
import { ValidationProblem } from '@/server/support/problems';
import { optionalQuery, validateQuery } from '../../validation';
import { LOCATION_MISSING } from './look-up-place';

/**
 * The Discover search (L2-004). Errors are keyed by the form's fields: `date`, `kind`, `location`
 * (from `lat` and `lng`) and `radius`, with the copy the form shows.
 */
export const RADII_KM = [40, 80, 120, 200] as const;
export const UNDER_800 = 'under-800';

const styleValues = new Set<string>(valuesOf(Style));

export const SearchArtistsRequest = z
  .object({
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
    kind: z.enum(valuesOf(GatheringKind), { error: 'Pick the kind of gathering.' }),
    /** Event location latitude; errors are reported under `location`. */
    lat: z.coerce
      .number({ error: LOCATION_MISSING })
      .min(-90, LOCATION_MISSING)
      .max(90, LOCATION_MISSING),
    /** Event location longitude; errors are reported under `location`. */
    lng: z.coerce
      .number({ error: LOCATION_MISSING })
      .min(-180, LOCATION_MISSING)
      .max(180, LOCATION_MISSING),
    /** Driving radius in kilometres. */
    radius: z.coerce
      .number({ error: 'Pick how far artists may drive.' })
      .refine(
        (value) => (RADII_KM as readonly number[]).includes(value),
        'Pick how far artists may drive.',
      ),
    /** How the tickets are ordered; Closest first by default. */
    sort: optionalQuery(
      z.enum(valuesOf(SearchSort), { error: 'Pick a sort order from the list.' }),
    ),
    /** Comma-separated style slugs, any of which matches, e.g. `band,gospel-choir`. */
    styles: optionalQuery(
      z
        .string()
        .refine(
          (value) => value.split(',').every((style) => styleValues.has(style)),
          'Pick styles from the chips.',
        ),
    ),
    /** `under-800`: only artists whose From price is below $800. */
    price: optionalQuery(z.literal(UNDER_800, { error: 'Pick a price from the chips.' })),
    /** `meta.nextCursor` from the previous page of the same search and sort. */
    cursor: optionalQuery(z.string()),
  })
  .check((context) => {
    const { cursor, sort } = context.value;
    if (cursor !== undefined && decodeCursor(cursor, sort ?? SearchSort.Closest) === null) {
      context.issues.push({
        code: 'custom',
        path: ['cursor'],
        message: 'Start the search again: these results have changed.',
        input: cursor,
      });
    }
  });

export type SearchArtistsRequest = z.infer<typeof SearchArtistsRequest>;

export interface ValidatedSearch {
  criteria: SearchCriteria;
  /** The sort key to continue after, or null on the first page. */
  after: number[] | null;
}

/** The request validated and inside the service area (L2-001.2), or a 422 problem. */
export async function validateSearch(request: NextRequest): Promise<ValidatedSearch> {
  const input = validateQuery(request, SearchArtistsRequest, {
    rename: { lat: 'location', lng: 'location' },
  });
  const location = new Coordinates(input.lat, input.lng);
  if (!(await serviceAreaContains(location))) {
    throw new ValidationProblem({ location: ['Zamaro serves churches within 200 km of Toronto.'] });
  }
  const sort = input.sort ?? SearchSort.Closest;
  const eventDate = bookingDate(input.date);
  if (eventDate === null) throw new ValidationProblem({ date: ['Pick your event date.'] });
  return {
    criteria: {
      eventDate,
      kind: input.kind,
      location,
      radiusKm: input.radius,
      sort,
      filter: {
        styles: input.styles === undefined ? [] : (input.styles.split(',') as Style[]),
        under800: input.price === UNDER_800,
      },
    },
    after: input.cursor === undefined ? null : decodeCursor(input.cursor, sort),
  };
}
