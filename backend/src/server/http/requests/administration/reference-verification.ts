import { z } from 'zod';

/** Tick or untick a reference (administration, L2-048.1). */
export const SetReferenceVerificationRequest = z.object({
  verified: z.boolean({ error: 'Say whether the reference is verified.' }),
});
