import { DateTime } from 'luxon';
import { z } from 'zod';
import type { AdminCheckView } from '@/server/actions/administration/list-vsc-queue';
import { VscStatus, valuesOf } from '@/server/enums';
import { ZONE } from '@/server/support/clock';

/**
 * A check in the admin queue (pages/admin-checks): whose, when issued and uploaded, what it replaces,
 * and its decision. Never the document itself.
 */
export const AdminCheckResource = z.object({
  id: z.number().int(),
  artist: z.object({
    id: z.number().int().nullable(),
    /** "Elijah Park"; the account's name when the person has no artist profile yet. */
    name: z.string(),
    slug: z.string().nullable(),
  }),
  status: z.enum(valuesOf(VscStatus)),
  /** `YYYY-MM-DD`, as printed on the check. */
  issuedOn: z.iso.date(),
  /** When it was uploaded, Toronto time. */
  uploadedAt: z.string(),
  /** `YYYY-MM-DD` once verified, or null. */
  expiresOn: z.iso.date().nullable(),
  /** When it was verified, or null. */
  verifiedAt: z.string().nullable(),
  /** The administrator who verified it, or null. */
  verifiedBy: z.object({ name: z.string() }).nullable(),
  /** The artist's verified check this one replaces, or null for a first check. */
  replaces: z.object({ verifiedUntil: z.iso.date() }).nullable(),
});

export const AdminCheckQueueResource = z.object({
  data: z.array(AdminCheckResource),
  meta: z.object({ waiting: z.number().int() }),
});

export const AdminCheckEnvelope = z.object({ data: AdminCheckResource });

export function toAdminCheckResource(view: AdminCheckView): z.infer<typeof AdminCheckResource> {
  const { check } = view;
  return {
    id: check.id,
    artist: view.artist,
    status: check.status,
    issuedOn: check.issuedOn,
    uploadedAt: DateTime.fromJSDate(check.createdAt, { zone: ZONE }).toISO() ?? '',
    expiresOn: check.expiresOn,
    verifiedAt:
      check.verifiedAt === null
        ? null
        : DateTime.fromJSDate(check.verifiedAt, { zone: ZONE }).toISO(),
    verifiedBy: view.verifiedBy,
    replaces: view.replaces,
  };
}
