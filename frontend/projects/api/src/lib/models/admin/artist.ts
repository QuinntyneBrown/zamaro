import type { CalendarDate } from '../../i18n/calendar-date';
import type { ActType, GatheringKind, Style } from '../discovery';

export type AdminArtistStatus = 'approved' | 'suspended';

/** One row of the admin Artists list (suspend-and-reinstate-artists, pages/admin-artists; L2-067). */
export interface AdminArtistRow {
  id: number;
  name: string;
  slug: string;
  actType: ActType;
  baseCity: string;
  /** One decimal, or null before the first review. */
  rating: number | null;
  status: AdminArtistStatus;
}

/** The list with the counts of every artist, whatever the search. */
export interface AdminArtistList {
  artists: AdminArtistRow[];
  total: number;
  approved: number;
  suspended: number;
}

/** A booking still to come, as the administrator's artist page lists it. */
export interface AdminUpcomingBooking {
  number: string;
  eventDate: CalendarDate;
  churchName: string;
  churchCity: string;
  kind: GatheringKind;
  status: 'requested' | 'accepted' | 'confirmed';
}

/** A past suspension, newest first; empty until suspend-and-reinstate (M8). */
export interface AdminSuspension {
  suspendedAt: string;
  reinstatedAt: string | null;
  reason: string;
}

/** An artist as the administrator sees them (pages/admin-artist): the account, the profile, the bookings, the standing. */
export interface AdminArtistDetail {
  id: number;
  name: string;
  slug: string;
  email: string;
  actType: ActType;
  styles: Style[];
  baseCity: string;
  fromPriceCents: number;
  rating: number | null;
  status: AdminArtistStatus;
  /** When the application was approved, or null for artists who predate the record. */
  approvedAt: string | null;
  upcomingBookings: AdminUpcomingBooking[];
  suspensions: AdminSuspension[];
}
