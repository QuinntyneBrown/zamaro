import { z } from 'zod';

export const ForgotPasswordRequest = z.object({
  /** The address the person signs in with; the answer is the same whether or not it has an account. */
  email: z.email({ error: 'Enter a valid email.' }).trim().max(254, 'Use at most 254 characters.'),
  /** The bot challenge provider's single-use token, checked before anything else. */
  challengeToken: z.string().max(2048),
});

export const CheckPasswordResetRequest = z.object({
  /** The token from the emailed link, `/reset-password/{token}`. */
  token: z.string({ error: 'The link is incomplete.' }).min(1, 'The link is incomplete.').max(128),
});

export const ResetPasswordRequest = z
  .object({
    /** The token from the emailed link, `/reset-password/{token}`. */
    token: z
      .string({ error: 'The link is incomplete.' })
      .min(1, 'The link is incomplete.')
      .max(128),
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
