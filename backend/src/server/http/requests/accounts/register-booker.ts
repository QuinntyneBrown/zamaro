import { z } from 'zod';

/** The sign-up form (accounts/register-booker); the password meets PasswordPolicy after the schema. */
export const RegisterBookerRequest = z.object({
  name: z
    .string({ error: 'Enter your full name.' })
    .trim()
    .min(1, 'Enter your full name.')
    .max(120, 'Use at most 120 characters.'),
  /** Written in lower case; an address in any case that already has an account gets the same answer. */
  email: z.email({ error: 'Enter a valid email.' }).trim().max(254, 'Use at most 254 characters.'),
  /** 12 to 128 characters, not in a known data breach. */
  password: z.string({ error: 'Enter a password.' }).min(1, 'Enter a password.'),
  /** The terms of use and privacy policy box; must be ticked. */
  acceptedTerms: z.literal(true, {
    error: 'Accept the terms and privacy policy to create an account.',
  }),
  /** The separate "Email me about new artists near my church" box; unticked unless the person ticks it. */
  marketingOptIn: z.boolean({ error: 'Tick or untick the box.' }).optional().default(false),
  /** The terms version the form showed (`GET /legal-documents/current`); 409 when it is no longer current. */
  termsVersion: z.string({ error: 'The terms version is missing.' }).length(7, 'Not a version.'),
  /** The privacy policy version the form showed; 409 when it is no longer current. */
  privacyPolicyVersion: z
    .string({ error: 'The privacy policy version is missing.' })
    .length(7, 'Not a version.'),
  /** The bot challenge provider's single-use token, checked before anything else. */
  challengeToken: z.string().max(2048),
  /** Where the verification link returns to: a path on the site. Anything else returns to Discover. */
  returnUrl: z.string().max(2048, 'Use at most 2048 characters.').nullable().optional(),
});

export type RegisterBookerRequest = z.infer<typeof RegisterBookerRequest>;
