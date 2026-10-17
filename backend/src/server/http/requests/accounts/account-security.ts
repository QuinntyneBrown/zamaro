import { z } from 'zod';
import { WRONG_PASSWORD } from '@/server/actions/accounts/current-password';

const EMAIL_MESSAGE = 'Enter an email address like name@church.ca.';

export const ChangeEmailRequest = z.object({
  /** The new address, different from the one the account signs in with. */
  email: z
    .email({ error: EMAIL_MESSAGE })
    .trim()
    .max(254, 'Use at most 254 characters.')
    .regex(/@[^@\s]+\.[^@\s]+$/, EMAIL_MESSAGE),
  /** The account's current password. */
  currentPassword: z.string({ error: WRONG_PASSWORD }).min(1, WRONG_PASSWORD),
});

export const ConfirmEmailChangeRequest = z.object({
  /** The token from the emailed link, `/account/email/confirm?token=…`. */
  token: z.string({ error: 'The link is incomplete.' }).min(1, 'The link is incomplete.').max(128),
});

export const ChangePasswordRequest = z
  .object({
    /** The account's current password. */
    currentPassword: z.string({ error: WRONG_PASSWORD }).min(1, WRONG_PASSWORD),
    /** 12 to 128 characters, not in a known data breach. */
    password: z.string({ error: 'Enter a new password.' }).min(1, 'Enter a new password.'),
    /** The new password typed again. */
    passwordConfirmation: z
      .string({ error: 'Type the new password again.' })
      .min(1, 'Type the new password again.'),
  })
  .refine((input) => input.password === input.passwordConfirmation, {
    path: ['passwordConfirmation'],
    error: 'The two passwords don’t match. Type the new one again.',
  });
