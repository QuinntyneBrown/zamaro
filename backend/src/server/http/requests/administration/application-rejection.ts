import { z } from 'zod';
import { ApplicationRejectionReason, valuesOf } from '@/server/enums';

export const REJECTION_NOTE_MAX = 1000;

/** Reject an application (L2-048.2): a reason from the fixed list and an optional note. */
export const RejectArtistApplicationRequest = z.object({
  reason: z.enum(valuesOf(ApplicationRejectionReason), {
    error: 'Choose a reason from the list.',
  }),
  note: z
    .string()
    .trim()
    .max(REJECTION_NOTE_MAX, 'Keep your note to 1,000 characters.')
    .optional()
    .transform((value) => (value === undefined || value === '' ? null : value)),
});
