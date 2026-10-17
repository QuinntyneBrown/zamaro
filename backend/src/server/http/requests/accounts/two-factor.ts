import { z } from 'zod';
import { CODE_DID_NOT_MATCH } from '@/server/actions/accounts/enable-two-factor';
import { WRONG_PROOF } from '@/server/actions/accounts/manage-two-factor';
import { WRONG_CODE } from '@/server/actions/accounts/two-factor-challenge';

export const TwoFactorCodeRequest = z.object({
  /** The 6 digits the authenticator app shows now. */
  code: z.string({ error: CODE_DID_NOT_MATCH }).min(1, CODE_DID_NOT_MATCH).max(16),
});

export const TwoFactorProofRequest = z.object({
  /** The 6 digits the app shows now, or one unused recovery code like "7kq4-m2xd". */
  code: z.string({ error: WRONG_PROOF }).min(1, WRONG_PROOF).max(32),
});

export const TwoFactorChallengeRequest = z
  .object({
    /** The 6 digits the authenticator app shows now. */
    code: z.string().max(16).optional(),
    /** One of the saved recovery codes, with or without the dash: "7kq4-m2xd". */
    recoveryCode: z.string().max(32).optional(),
  })
  .refine((input) => input.code !== undefined || input.recoveryCode !== undefined, {
    path: ['code'],
    error: WRONG_CODE,
  });
