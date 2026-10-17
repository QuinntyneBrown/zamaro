import { z } from 'zod';
import type { churches } from '@/server/db/schema';
import { decryptField } from '@/server/support/encryption/field-cipher';
import { formatPhone } from '@/server/support/phone';

/**
 * A booker's church, for its owner only: the phone is decrypted for them and is never in a public
 * resource (L2-083, accounts/manage-church-profile).
 */
export const ChurchResource = z.object({
  name: z.string(),
  streetAddress: z.string(),
  city: z.string(),
  /** Two letters: "ON". */
  province: z.string(),
  /** "L7R 1A3". */
  postalCode: z.string(),
  /** "905-555-0123". */
  phone: z.string(),
  denomination: z.string().nullable(),
  typicalAttendance: z.number().int().nullable(),
});

export const ChurchEnvelope = z.object({ data: ChurchResource.nullable() });

export type ChurchRow = typeof churches.$inferSelect;

export function toChurchResource(church: ChurchRow): z.infer<typeof ChurchResource> {
  return {
    name: church.name,
    streetAddress: church.streetAddress,
    city: church.city,
    province: church.province,
    postalCode: church.postalCode,
    phone: formatPhone(decryptField(church.phone)),
    denomination: church.denomination,
    typicalAttendance: church.typicalAttendance,
  };
}
