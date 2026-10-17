import { DateTime } from 'luxon';
import { z } from 'zod';
import type { CheckRow } from '@/server/actions/artist-onboarding/upload-vulnerable-sector-check';
import { VscStatus, valuesOf } from '@/server/enums';
import { ZONE } from '@/server/support/clock';

/**
 * One check as its owner (and the admin queue) sees it: where it stands and its dates. Never the
 * document, its key or its name (L2-049.4).
 */
export const VulnerableSectorCheckResource = z.object({
  id: z.number().int(),
  status: z.enum(valuesOf(VscStatus)),
  /** `YYYY-MM-DD`, as printed on the check. */
  issuedOn: z.iso.date(),
  /** `YYYY-MM-DD`, three years after the issue date once verified; null before. */
  expiresOn: z.iso.date().nullable(),
  /** When it was uploaded, Toronto time. */
  uploadedAt: z.string(),
  /** When an administrator verified it, or null. */
  verifiedAt: z.string().nullable(),
});

export const CheckEnvelope = z.object({ data: VulnerableSectorCheckResource });

export const CurrentChecksResource = z.object({
  data: z.object({
    /** The most recent verified check, which Youth event searches count, or null. */
    verified: VulnerableSectorCheckResource.nullable(),
    /** The newest check of any status, or null. */
    latest: VulnerableSectorCheckResource.nullable(),
  }),
});

export function toCheckResource(check: CheckRow): z.infer<typeof VulnerableSectorCheckResource> {
  return {
    id: check.id,
    status: check.status,
    issuedOn: check.issuedOn,
    expiresOn: check.expiresOn,
    uploadedAt: DateTime.fromJSDate(check.createdAt, { zone: ZONE }).toISO() ?? '',
    verifiedAt:
      check.verifiedAt === null
        ? null
        : DateTime.fromJSDate(check.verifiedAt, { zone: ZONE }).toISO(),
  };
}
