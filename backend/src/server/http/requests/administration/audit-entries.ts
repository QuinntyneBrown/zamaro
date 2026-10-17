import { z } from 'zod';
import { decodeAuditCursor } from '@/server/actions/administration/list-audit-entries';
import { AuditOutcome, valuesOf } from '@/server/enums';
import { optionalQuery } from '../../validation';

/** The audit log's filters and page cursor (administration/record-audit-log). */
export const ListAuditEntriesRequest = z
  .object({
    /** The actor's email, any case. */
    actor: optionalQuery(z.string().max(254)),
    /** One action code, such as `auth.sign_in`; a code no entry carries yet matches nothing. */
    action: optionalQuery(
      z
        .string()
        .max(64)
        .regex(/^[a-z0-9_.]+$/, 'Not an action code.'),
    ),
    /** A booking number, or part of an artist's or user's name or a user's email. */
    target: optionalQuery(z.string().max(100)),
    outcome: optionalQuery(z.enum(valuesOf(AuditOutcome), { error: 'Not an outcome.' })),
    /** `YYYY-MM-DD`, Toronto time, inclusive. */
    from: optionalQuery(z.iso.date({ error: 'Not a date.' })),
    to: optionalQuery(z.iso.date({ error: 'Not a date.' })),
    /** `meta.nextCursor` from the previous page. */
    cursor: optionalQuery(
      z.string().refine((value) => decodeAuditCursor(value) !== null, {
        error: 'The log has changed. Reload the page.',
      }),
    ),
  })
  .refine((input) => input.from === undefined || input.to === undefined || input.to >= input.from, {
    path: ['to'],
    error: 'The end of the range is before its start.',
  });
