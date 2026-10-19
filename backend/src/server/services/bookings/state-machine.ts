import { eq } from 'drizzle-orm';
import type { Transaction } from '@/server/db/client';
import { bookings, bookingTransitions } from '@/server/db/schema';
import { BookingStatus } from '@/server/enums';
import { now } from '@/server/support/clock';

/**
 * The booking's allowed status changes (L2-029). The first version holds what availability needs:
 * an open request, Requested or Accepted, can be Declined. Each journey that moves a booking
 * further adds its edges here.
 */
const ALLOWED: Partial<Record<BookingStatus, BookingStatus[]>> = {
  [BookingStatus.Requested]: [BookingStatus.Declined],
  [BookingStatus.Accepted]: [BookingStatus.Declined],
};

export interface TransitionActor {
  kind: 'artist' | 'booker' | 'administrator' | 'system';
  id: number | null;
}

/** Moves the booking to `to` and records the transition, or throws when the change is not allowed. */
export async function transitionBooking(
  tx: Transaction,
  booking: { id: number; status: BookingStatus },
  to: BookingStatus,
  actor: TransitionActor,
  reason: string | null = null,
): Promise<void> {
  if (!ALLOWED[booking.status]?.includes(to)) {
    throw new Error(`A ${booking.status} booking cannot become ${to}.`);
  }
  const at = now().toJSDate();
  await tx.update(bookings).set({ status: to, updatedAt: at }).where(eq(bookings.id, booking.id));
  await tx.insert(bookingTransitions).values({
    bookingId: booking.id,
    fromStatus: booking.status,
    toStatus: to,
    actorKind: actor.kind,
    actorId: actor.id,
    reason,
    occurredAt: at,
  });
}
