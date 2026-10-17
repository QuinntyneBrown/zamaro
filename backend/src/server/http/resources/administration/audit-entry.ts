import { DateTime } from 'luxon';
import { z } from 'zod';
import type { AuditEntryView } from '@/server/actions/administration/list-audit-entries';
import { AuditOutcome, Role, valuesOf } from '@/server/enums';
import { ZONE } from '@/server/support/clock';

/**
 * One audit log row as the admin viewer shows it: when, who (or "System" / "Unknown"), what, to
 * what, from where, and how it ended (administration/record-audit-log). Context never leaves the
 * server beyond the attempted email of a failed sign-in.
 */
export const AuditEntryResource = z.object({
  id: z.number().int(),
  /** When it happened, Toronto time, ISO 8601. */
  occurredAt: z.string(),
  /** Who did it; null for the system (no address) or an unknown sign-in (an address and an attempted email). */
  actor: z
    .object({
      name: z.string(),
      email: z.string(),
      role: z.enum(valuesOf(Role)).nullable(),
    })
    .nullable(),
  /** The email a failed sign-in tried, when it belongs to no account. */
  attemptedEmail: z.string().nullable(),
  /** The action code: `auth.sign_in_failed`. */
  action: z.string(),
  /** What it acted on: "User · Priya Nair", "Booking · ZAM-0101"; null when nothing. */
  target: z.object({ type: z.string(), label: z.string().nullable() }).nullable(),
  /** The client's address, or null for a queued job. */
  ipAddress: z.string().nullable(),
  outcome: z.enum(valuesOf(AuditOutcome)),
});

export const AuditEntryPageResource = z.object({
  data: z.array(AuditEntryResource),
  meta: z.object({
    perPage: z.number().int(),
    /** Pass as `cursor` for the older entries; null on the last page. */
    nextCursor: z.string().nullable(),
  }),
});

export const AuditEntryEnvelope = z.object({ data: AuditEntryResource });

export function toAuditEntryResource(view: AuditEntryView): z.infer<typeof AuditEntryResource> {
  const { entry, actor, targetLabel } = view;
  const attempted = entry.context.email;
  return {
    id: entry.id,
    occurredAt: DateTime.fromJSDate(entry.occurredAt, { zone: ZONE }).toISO() ?? '',
    actor:
      actor === null
        ? null
        : { name: actor.name, email: actor.email, role: entry.actorRole as Role | null },
    attemptedEmail: actor === null && typeof attempted === 'string' ? attempted : null,
    action: entry.action,
    target:
      entry.targetType === null ? null : { type: typeLabel(entry.targetType), label: targetLabel },
    ipAddress: entry.ipAddress,
    outcome: entry.outcome,
  };
}

/** "User", "Booking", "Review report" from the stored type. */
function typeLabel(type: string): string {
  const words = type.replace(/[_-]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}
