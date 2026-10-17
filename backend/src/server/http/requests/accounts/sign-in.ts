import { z } from 'zod';

export const SignInRequest = z.object({
  /** The address the account signs in with, in any case. */
  email: z
    .string({ error: 'Enter your email.' })
    .min(1, 'Enter your email.')
    .max(254, 'Use at most 254 characters.'),
  password: z
    .string({ error: 'Enter your password.' })
    .min(1, 'Enter your password.')
    .max(1024, 'Use at most 1024 characters.'),
});

export type SignInRequest = z.infer<typeof SignInRequest>;
