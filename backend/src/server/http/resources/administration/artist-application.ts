import { DateTime } from 'luxon';
import { z } from 'zod';
import type { ApplicationRow } from '@/server/actions/administration/list-artist-applications';
import { ActType, valuesOf } from '@/server/enums';
import { ZONE } from '@/server/support/clock';

/** A row of the application queue (pages/admin-applications). */
export const AdminApplicationRowResource = z.object({
  id: z.number().int(),
  /** The applicant-facing number, such as `A-0219`. */
  number: z.string(),
  name: z.string(),
  actType: z.enum(valuesOf(ActType)),
  baseCity: z.string(),
  /** When it was submitted, Toronto time. */
  submittedAt: z.string(),
});

export const AdminApplicationQueueResource = z.object({
  data: z.array(AdminApplicationRowResource),
  meta: z.object({ waiting: z.number().int() }),
});

export function toAdminApplicationRow(
  application: ApplicationRow,
): z.infer<typeof AdminApplicationRowResource> {
  return {
    id: application.id,
    number: application.number,
    name: application.name,
    actType: application.actType,
    baseCity: application.baseCity,
    submittedAt: DateTime.fromJSDate(application.submittedAt, { zone: ZONE }).toISO() ?? '',
  };
}
