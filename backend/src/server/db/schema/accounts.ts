import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  unique,
  varchar,
  date,
} from 'drizzle-orm/pg-core';
import { foreignId, id, timestamps, timestamptz } from './columns';
import { consentKind, consentSource, themePreference } from './enums';

export const users = pgTable('users', {
  id: id(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  emailVerifiedAt: timestamptz(),
  password: varchar({ length: 255 }).notNull(),
  // A new address asked for and not yet proven (L2-025.1); the account email stays until it is.
  pendingEmail: varchar({ length: 255 }),
  // TOTP two-step sign-in (L2-072.3): the key is encrypted by the API (ADR-0020).
  mfaEnabled: boolean().notNull().default(false),
  twoFactorSecret: text(),
  twoFactorConfirmedAt: timestamptz(),
  // When the booker first saved anyone, so "Saved artists are private" shows once.
  firstSavedAt: timestamptz(),
  // The theme chosen on any signed-in device (user-experience/switch-theme); null follows the device.
  themePreference: themePreference(),
  ...timestamps(),
});

/** The closed set of roles (Role); a person can hold more than one. */
export const roles = pgTable('roles', {
  id: id(),
  name: varchar({ length: 20 }).notNull().unique(),
});

export const roleUser = pgTable(
  'role_user',
  {
    userId: foreignId()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: foreignId()
      .notNull()
      .references(() => roles.id),
  },
  (table) => [primaryKey({ columns: [table.userId, table.roleId] })],
);

/** Single-use links that prove a person holds their address: only the token's SHA-256 is stored. */
export const emailVerificationTokens = pgTable(
  'email_verification_tokens',
  {
    id: id(),
    userId: foreignId()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: char({ length: 64 }).notNull().unique(),
    expiresAt: timestamptz().notNull(),
    usedAt: timestamptz(),
    createdAt: timestamptz()
      .notNull()
      .default(sql`now()`),
  },
  (table) => [index().on(table.userId)],
);

/** Single-use reset links: only the token's SHA-256 is stored; the link works for 60 minutes. */
export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: id(),
    userId: foreignId()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: char({ length: 64 }).notNull().unique(),
    expiresAt: timestamptz().notNull(),
    usedAt: timestamptz(),
    createdAt: timestamptz()
      .notNull()
      .default(sql`now()`),
  },
  (table) => [index().on(table.userId)],
);

/** Single-use email change links: the token's SHA-256, the new address, expiry and use (M2 D11). */
export const emailChangeTokens = pgTable(
  'email_change_tokens',
  {
    id: id(),
    userId: foreignId()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: char({ length: 64 }).notNull().unique(),
    newEmail: varchar({ length: 255 }).notNull(),
    expiresAt: timestamptz().notNull(),
    usedAt: timestamptz(),
    createdAt: timestamptz()
      .notNull()
      .default(sql`now()`),
  },
  (table) => [index().on(table.userId)],
);

/** Ten single-use codes for a lost phone; only their SHA-256 is stored. */
export const recoveryCodes = pgTable(
  'recovery_codes',
  {
    id: id(),
    userId: foreignId()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    codeHash: char({ length: 64 }).notNull(),
    usedAt: timestamptz(),
    createdAt: timestamptz()
      .notNull()
      .default(sql`now()`),
  },
  (table) => [index().on(table.userId, table.codeHash)],
);

/**
 * Every signed-in session, so a reset or a changed password can end the others. The key is the
 * SHA-256 of the session ID; the ID itself is kept only encrypted, to destroy the session.
 */
export const userSessions = pgTable(
  'user_sessions',
  {
    id: char({ length: 64 }).primaryKey(),
    userId: foreignId()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    encryptedSessionId: text().notNull(),
    deviceLabel: varchar({ length: 255 }),
    approximateCity: varchar({ length: 255 }),
    ipAddress: varchar({ length: 45 }),
    lastActiveAt: timestamptz().notNull(),
    createdAt: timestamptz()
      .notNull()
      .default(sql`now()`),
  },
  (table) => [index().on(table.userId)],
);

/**
 * A booker's one church (accounts/manage-church-profile). The address is geocoded and inside the
 * service area before it is stored; the phone is encrypted by the API (L2-079.2).
 */
export const churches = pgTable('churches', {
  id: id(),
  bookerId: foreignId()
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar({ length: 120 }).notNull(),
  streetAddress: varchar({ length: 255 }).notNull(),
  city: varchar({ length: 255 }).notNull(),
  province: char({ length: 2 }).notNull().default('ON'),
  postalCode: varchar({ length: 7 }).notNull(),
  latitude: numeric({ precision: 9, scale: 6, mode: 'number' }).notNull(),
  longitude: numeric({ precision: 9, scale: 6, mode: 'number' }).notNull(),
  phone: text().notNull(),
  denomination: varchar({ length: 255 }),
  typicalAttendance: integer(),
  ...timestamps(),
});

/** Each published version of the terms and the privacy policy (privacy/record-consent). */
export const legalDocuments = pgTable(
  'legal_documents',
  {
    id: id(),
    kind: consentKind().notNull(),
    // The year and month it takes effect: "2026-10".
    version: varchar({ length: 7 }).notNull(),
    effectiveFrom: date({ mode: 'string' }).notNull(),
    url: varchar({ length: 255 }).notNull(),
    summaryOfChanges: jsonb().$type<string[]>().notNull().default([]),
    ...timestamps(),
  },
  (table) => [unique().on(table.kind, table.version), index().on(table.kind, table.effectiveFrom)],
);

/** What each person agreed to and when, as CASL evidence (L2-080). Append-only (trigger in the migration). */
export const consentRecords = pgTable(
  'consent_records',
  {
    id: id(),
    userId: foreignId()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: consentKind().notNull(),
    // Null for the marketing choice.
    documentVersion: varchar({ length: 7 }),
    granted: boolean().notNull(),
    recordedAt: timestamptz().notNull(),
    source: consentSource().notNull(),
    ipAddress: varchar({ length: 45 }),
    userAgent: varchar({ length: 512 }),
  },
  (table) => [index().on(table.userId, table.kind, table.recordedAt)],
);
