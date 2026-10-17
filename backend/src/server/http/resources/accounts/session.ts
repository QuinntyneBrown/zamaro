import { z } from 'zod';
import type { ActiveSession } from '@/server/services/accounts/session-registry';
import { UNKNOWN_DEVICE } from '@/server/support/device-label';
import { ZONE } from '@/server/support/clock';
import { DateTime } from 'luxon';

/**
 * One signed-in session, for its owner (L2-025.3). Never the session ID itself or the full IP
 * address: `id` is the registry's key, the SHA-256 of the session ID.
 */
export const SessionResource = z.object({
  /** Names the session for ending it; not the session ID. */
  id: z.string(),
  /** "Chrome on Windows". */
  deviceLabel: z.string(),
  /** "Burlington, ON", or null when the network cannot be placed. */
  approximateCity: z.string().nullable(),
  /** When the session was last used, to within 5 minutes. */
  lastActiveAt: z.string(),
  /** The browser asking. */
  isCurrent: z.boolean(),
});

export const SessionListResource = z.object({ data: z.array(SessionResource) });

export function toSessionResource(session: ActiveSession): z.infer<typeof SessionResource> {
  return {
    id: session.id,
    deviceLabel: session.deviceLabel ?? UNKNOWN_DEVICE,
    approximateCity: session.approximateCity,
    lastActiveAt: DateTime.fromJSDate(session.lastActiveAt, { zone: ZONE }).toISO() ?? '',
    isCurrent: session.isCurrent,
  };
}
