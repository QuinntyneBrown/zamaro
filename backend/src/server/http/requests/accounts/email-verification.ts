import { z } from 'zod';

export const VerifyEmailRequest = z.object({
  /** The token from the emailed link's `token` parameter. */
  token: z.string({ error: 'The link is incomplete.' }).min(1, 'The link is incomplete.').max(128),
});

export const ResendVerificationEmailRequest = z.object({
  /** A guest's expired link: the new one goes to its owner. Ignored when signed in. */
  token: z.string().max(128).nullable().optional(),
  /** A guest who has just signed up: the address they typed. Ignored when signed in or with `token`. */
  email: z.email({ error: 'Enter a valid email.' }).max(254).nullable().optional(),
  /** Where the new link returns to: a path on the site. Anything else returns to Discover. */
  returnUrl: z.string().max(2048).nullable().optional(),
});
