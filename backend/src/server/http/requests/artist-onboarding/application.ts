import { z } from 'zod';
import { ActType, Style, valuesOf } from '@/server/enums';
import { toE164 } from '@/server/support/phone';
import { ValidationProblem } from '@/server/support/problems';
import { errorsOf } from '../../validation';

/**
 * Everything an applicant sends (apply-as-artist, L2-047.1, L2-075). The bot check ran before this;
 * the `Idempotency-Key` header is checked here too, as `idempotencyKey`. The videos' state and the
 * references' independence are checked by the action, against the database.
 */
export const BIO_MIN = 100;
export const BIO_MAX = 1500;

const NAME = 'Enter your name, or your act’s name.';
const EMAIL = 'Enter an email address like name@church.ca.';
const STYLES = 'Pick 1 to 4 styles.';
const BIO = 'Write a bio of 100 to 1,500 characters.';
const PRICE = 'Enter a “from” price in whole dollars from $100 to $20,000.';
const DRIVE = 'Choose how far you’ll drive, from 20 to 200 km.';
const VIDEOS = 'Upload at least one video, and wait for each one to finish.';
const REFERENCES = 'Name two church references.';
export const CONTACT = 'Add a phone number or email so we can reach them.';
const KEY = 'Send an Idempotency-Key header: a UUID minted once per application.';

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A phone number or an email address. */
export function isContact(value: string): boolean {
  return toE164(value) !== null || EMAIL_SHAPE.test(value.trim());
}

export const SubmitArtistApplicationRequest = z.object({
  /** The applicant's name, or the act's, as churches will see it. */
  name: z.string({ error: NAME }).trim().min(2, NAME).max(100, 'Use at most 100 characters.'),
  /** Where the confirmation and the decision go. */
  email: z.email({ error: EMAIL }).trim().max(254, 'Use at most 254 characters.'),
  /** A town within 200 km of Toronto: "Scarborough". */
  baseCity: z
    .string({ error: 'Enter the town you’re based in.' })
    .trim()
    .min(1, 'Enter the town you’re based in.')
    .max(120, 'Use at most 120 characters.'),
  actType: z.enum(valuesOf(ActType), { error: 'Choose an act type.' }),
  /** 1 to 4 of the style tags. */
  styles: z
    .array(z.enum(valuesOf(Style), { error: STYLES }), { error: STYLES })
    .min(1, STYLES)
    .max(4, STYLES)
    .refine((styles) => new Set(styles).size === styles.length, STYLES),
  /** 100 to 1,500 characters. */
  bio: z.string({ error: BIO }).trim().min(BIO_MIN, BIO).max(BIO_MAX, BIO),
  /** Whole dollars per service, $100 to $20,000. */
  fromPrice: z.number({ error: PRICE }).int(PRICE).min(100, PRICE).max(20000, PRICE),
  /** 20 to 200 km, in steps of 10. */
  maxDriveKm: z
    .number({ error: DRIVE })
    .int(DRIVE)
    .min(20, DRIVE)
    .max(200, DRIVE)
    .refine((km) => km % 10 === 0, DRIVE),
  /** The tokens of at least one uploaded video, in the order they should show. */
  videos: z
    .array(z.string({ error: VIDEOS }), { error: VIDEOS })
    .min(1, VIDEOS)
    .max(8, 'You can have up to 8 videos.')
    .refine((tokens) => new Set(tokens).size === tokens.length, VIDEOS),
  /** Exactly two church references. */
  references: z
    .array(
      z.object({
        name: z
          .string({ error: 'Enter the reference’s name.' })
          .trim()
          .min(2, 'Enter the reference’s name.')
          .max(100, 'Use at most 100 characters.'),
        church: z
          .string({ error: 'Enter the reference’s church.' })
          .trim()
          .min(2, 'Enter the reference’s church.')
          .max(120, 'Use at most 120 characters.'),
        /** A phone number or an email address. */
        contact: z.string({ error: CONTACT }).trim().max(254, CONTACT).refine(isContact, CONTACT),
      }),
      { error: REFERENCES },
    )
    .length(2, REFERENCES),
  /** The bot challenge's token. */
  challengeToken: z.string(),
  /** The `Idempotency-Key` header: a UUID minted once per application, repeated on a retry. */
  idempotencyKey: z.uuid({ error: KEY }),
});

export type SubmitArtistApplicationRequest = z.infer<typeof SubmitArtistApplicationRequest>;

/**
 * The whole form checked at once, so the applicant reads every problem together (L2-108.3): the
 * schema's rules and the rule that a reference is someone other than the applicant (L2-047.2),
 * compared without case.
 */
export function validateApplication(input: unknown): SubmitArtistApplicationRequest {
  const parsed = SubmitArtistApplicationRequest.safeParse(input);
  const errors = parsed.success ? {} : errorsOf(parsed.error, {});
  const raw = (input ?? {}) as { email?: unknown; references?: unknown };
  const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
  if (email !== '' && Array.isArray(raw.references)) {
    for (const [index, reference] of raw.references.entries()) {
      const contact = (reference as { contact?: unknown } | null)?.contact;
      if (typeof contact === 'string' && contact.trim().toLowerCase() === email) {
        errors[`references.${String(index)}.contact`] = [
          'References must be someone other than you.',
        ];
      }
    }
  }
  if (Object.keys(errors).length > 0 || !parsed.success) throw new ValidationProblem(errors);
  return parsed.data;
}
