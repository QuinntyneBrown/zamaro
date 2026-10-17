import { z } from 'zod';
import { isNorthAmericanPhone, PHONE_MESSAGE } from '@/server/support/phone';

export const UpdateProfileRequest = z.object({
  /** The person's name, which artists see on requests: "Naomi Fraser". */
  name: z
    .string({ error: 'Enter your name.' })
    .trim()
    .min(1, 'Enter your name.')
    .max(120, 'Use at most 120 characters for your name.'),
});

const POSTAL_CODE = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;
const CHURCH_NAME = 'Use 2 to 120 characters for the church name.';
const POSTAL_CODE_MESSAGE = 'Enter a postal code like L7R 1A3, with six characters.';
const ATTENDANCE = 'Enter the typical attendance as a whole number above 0.';

/** The church form (L2-024.1): checked before the address is looked up. */
export const SaveChurchRequest = z.object({
  /** 2 to 120 characters. */
  name: z.string({ error: CHURCH_NAME }).trim().min(2, CHURCH_NAME).max(120, CHURCH_NAME),
  streetAddress: z
    .string({ error: 'Enter the street address.' })
    .trim()
    .min(1, 'Enter the street address.')
    .max(255, 'Use at most 255 characters.'),
  city: z
    .string({ error: 'Enter the city.' })
    .trim()
    .min(1, 'Enter the city.')
    .max(120, 'Use at most 120 characters.'),
  /** A Canadian postal code: "L7R 1A3", with or without the space, in any case. */
  postalCode: z
    .string({ error: POSTAL_CODE_MESSAGE })
    .trim()
    .regex(POSTAL_CODE, POSTAL_CODE_MESSAGE),
  /** A North American number, in any common format: "905-555-0123". */
  phone: z.string({ error: PHONE_MESSAGE }).refine(isNorthAmericanPhone, PHONE_MESSAGE),
  denomination: z.string().trim().max(120, 'Use at most 120 characters.').nullable().optional(),
  /** A whole number of people above 0. */
  typicalAttendance: z
    .number({ error: ATTENDANCE })
    .int(ATTENDANCE)
    .min(1, ATTENDANCE)
    .max(100_000, ATTENDANCE)
    .nullable()
    .optional(),
});

export type SaveChurchRequest = z.infer<typeof SaveChurchRequest>;

export const UpdateContactPhoneRequest = z.object({
  /** A North American number, in any common format: "905-555-0148". */
  contactPhone: z.string({ error: PHONE_MESSAGE }).refine(isNorthAmericanPhone, PHONE_MESSAGE),
});
