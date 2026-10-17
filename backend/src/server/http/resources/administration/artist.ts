import { DateTime } from 'luxon';
import { z } from 'zod';
import type {
  AdminArtistDetail,
  AdminArtistRow,
} from '@/server/actions/administration/list-admin-artists';
import {
  ActType,
  ArtistStatus,
  BookingStatus,
  GatheringKind,
  Style,
  valuesOf,
} from '@/server/enums';
import { ZONE } from '@/server/support/clock';

/** One row of the admin Artists list (pages/admin-artists, L2-067). */
export const AdminArtistResource = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string(),
  actType: z.enum(valuesOf(ActType)),
  baseCity: z.string(),
  /** One decimal, or null before the first review. */
  rating: z.number().nullable(),
  status: z.enum(valuesOf(ArtistStatus)),
});

export const AdminArtistListResource = z.object({
  data: z.array(AdminArtistResource),
  meta: z.object({
    total: z.number().int(),
    approved: z.number().int(),
    suspended: z.number().int(),
  }),
});

/**
 * An artist as the administrator sees them (pages/admin-artist, M3 D18): the account, the profile,
 * the bookings still to come and their standing. Suspend and reinstate join with M8.
 */
export const AdminArtistDetailResource = AdminArtistResource.extend({
  /** The account's address. */
  email: z.string(),
  /** Style codes, in the profile's order. */
  styles: z.array(z.enum(valuesOf(Style))),
  /** The "from" price per service, in cents. */
  fromPriceCents: z.number().int(),
  /** When the application was approved, Toronto time, or null for artists who predate the record. */
  approvedAt: z.string().nullable(),
  /** Requested, accepted and confirmed bookings from today, soonest first. */
  upcomingBookings: z.array(
    z.object({
      number: z.string(),
      eventDate: z.iso.date(),
      churchName: z.string(),
      churchCity: z.string(),
      kind: z.enum(valuesOf(GatheringKind)),
      status: z.enum(valuesOf(BookingStatus)),
    }),
  ),
  /** Past suspensions, newest first; always empty until suspend-and-reinstate (M8). */
  suspensions: z.array(
    z.object({
      suspendedAt: z.string(),
      reinstatedAt: z.string().nullable(),
      reason: z.string(),
    }),
  ),
});

export const AdminArtistDetailEnvelope = z.object({ data: AdminArtistDetailResource });

export function toAdminArtistResource(row: AdminArtistRow): z.infer<typeof AdminArtistResource> {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    actType: row.actType,
    baseCity: row.baseCity,
    rating: row.rating,
    status: row.status,
  };
}

export function toAdminArtistDetailResource(
  detail: AdminArtistDetail,
): z.infer<typeof AdminArtistDetailResource> {
  return {
    ...toAdminArtistResource(detail),
    email: detail.email,
    styles: detail.styles,
    fromPriceCents: detail.fromPriceCents,
    approvedAt:
      detail.approvedAt === null
        ? null
        : DateTime.fromJSDate(detail.approvedAt, { zone: ZONE }).toISO(),
    upcomingBookings: detail.upcomingBookings,
    suspensions: [],
  };
}
