import { sql } from 'drizzle-orm';
import {
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  smallint,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './accounts';
import { foreignId, id, timestamps, timestamptz } from './columns';
import { actType, applicationStatus, uploadPurpose, uploadStatus, vscStatus } from './enums';

/**
 * Every file anyone uploads passes through here (security/scan-and-serve-uploads): quarantined
 * until the scan, then clean under a random object name, or rejected and deleted. An applicant's
 * upload has no user yet (ADR-0026).
 */
export const uploads = pgTable(
  'uploads',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: foreignId().references(() => users.id),
    purpose: uploadPurpose().notNull(),
    detectedMime: varchar({ length: 100 }).notNull(),
    sizeBytes: foreignId().notNull(),
    quarantineKey: varchar({ length: 255 }),
    objectKey: varchar({ length: 255 }),
    status: uploadStatus().notNull(),
    rejectionReason: varchar({ length: 32 }),
    scannerSignature: varchar({ length: 255 }),
    scannedAt: timestamptz(),
    ...timestamps(),
  },
  (table) => [index().on(table.userId, table.purpose), index().on(table.status)],
);

/**
 * A Police Vulnerable Sector Check an artist uploaded (L2-049): scanned, then waiting for an
 * administrator, then verified for three years from its issue date. The document is ciphertext on
 * the documents disk under `storage_key`, readable through DocumentVault (ADR-0025).
 */
export const vulnerableSectorChecks = pgTable(
  'vulnerable_sector_checks',
  {
    id: id(),
    userId: foreignId()
      .notNull()
      .references(() => users.id),
    issuedOn: date({ mode: 'string' }).notNull(),
    // A check waiting for the scan or verification has no expiry yet.
    expiresOn: date({ mode: 'string' }),
    status: vscStatus().notNull(),
    verifiedAt: timestamptz(),
    uploadId: uuid().references(() => uploads.id),
    storageKey: varchar({ length: 255 }),
    wrappedDataKey: text(),
    mimeType: varchar({ length: 100 }),
    sizeBytes: foreignId(),
    verifiedBy: foreignId().references(() => users.id),
    renewalReminderSentAt: timestamptz(),
    ...timestamps(),
  },
  (table) => [index().on(table.status, table.expiresOn)],
);

/**
 * An applicant's submitted details and references (apply-as-artist, L2-047). One pending
 * application per email is enforced by a partial unique index on the lower-cased address.
 */
export const artistApplications = pgTable(
  'artist_applications',
  {
    id: id(),
    userId: foreignId().references(() => users.id, { onDelete: 'set null' }),
    number: varchar({ length: 12 }).notNull().unique(),
    name: varchar({ length: 100 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    actType: actType().notNull(),
    baseCity: varchar({ length: 255 }).notNull(),
    baseLatitude: numeric({ precision: 9, scale: 6, mode: 'number' }).notNull(),
    baseLongitude: numeric({ precision: 9, scale: 6, mode: 'number' }).notNull(),
    styles: jsonb().$type<string[]>().notNull(),
    bio: text().notNull(),
    fromPriceCents: integer().notNull(),
    maxDriveKm: smallint().notNull(),
    status: applicationStatus().notNull(),
    idempotencyKey: uuid().notNull().unique(),
    submittedAt: timestamptz().notNull(),
    decidedAt: timestamptz(),
    decidedBy: foreignId().references(() => users.id, { onDelete: 'set null' }),
    /** One of ApplicationRejectionReason once rejected (L2-048.2). */
    rejectionReason: text(),
    /** The administrator's optional note to the applicant, at most 1,000 characters (L2-048.2). */
    rejectionNote: varchar({ length: 1000 }),
    ...timestamps(),
  },
  (table) => [
    index().on(table.status, table.submittedAt),
    uniqueIndex('artist_applications_one_pending_per_email')
      .on(sql`lower(${table.email})`)
      .where(sql`${table.status} = 'submitted'`),
  ],
);

/** A church reference on an application (L2-047.1): phone and email kept encrypted (L2-079.2). */
export const applicationReferences = pgTable('application_references', {
  id: id(),
  artistApplicationId: foreignId()
    .notNull()
    .references(() => artistApplications.id, { onDelete: 'cascade' }),
  name: varchar({ length: 100 }).notNull(),
  church: varchar({ length: 120 }).notNull(),
  phone: text(),
  email: text(),
  verifiedAt: timestamptz(),
  verifiedBy: foreignId().references(() => users.id, { onDelete: 'set null' }),
  ...timestamps(),
});
