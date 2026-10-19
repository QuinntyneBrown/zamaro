import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  unique,
  uuid,
  varchar,
  check,
} from 'drizzle-orm/pg-core';
import { users } from './accounts';
import { foreignId, id, timestamps, timestamptz } from './columns';
import {
  actType,
  artistStatus,
  musicalKey,
  overrideState,
  pronoun,
  style,
  videoStatus,
} from './enums';
import { artistApplications } from './onboarding';

export interface PhotoRendition {
  width: number;
  format: 'avif' | 'webp';
  key: string;
}

export const artists = pgTable(
  'artists',
  {
    id: id(),
    userId: foreignId()
      .notNull()
      .unique()
      .references(() => users.id),
    slug: varchar({ length: 255 }).notNull().unique(),
    ticketNumber: varchar({ length: 255 }).notNull().unique(),
    displayName: varchar({ length: 255 }).notNull(),
    actType: actType().notNull(),
    baseCity: varchar({ length: 255 }).notNull(),
    baseLatitude: numeric({ precision: 9, scale: 6, mode: 'number' }).notNull(),
    baseLongitude: numeric({ precision: 9, scale: 6, mode: 'number' }).notNull(),
    maxDriveKm: smallint().notNull(),
    fromPriceCents: integer().notNull(),
    status: artistStatus().notNull(),
    payoutReady: boolean().notNull().default(false),
    publishedAt: timestamptz(),
    // When the application was approved (review-artist-application, M3 D19).
    approvedAt: timestamptz(),
    // The public profile's text (L2-012, L2-013).
    pronoun: pronoun().notNull().default('they'),
    headline: varchar({ length: 80 }).notNull().default(''),
    aboutHeading: varchar({ length: 80 }),
    bio: text(),
    languages: jsonb().$type<string[]>().notNull().default([]),
    // An artist's private contact phone (L2-025.4), encrypted by the API; never public.
    contactPhone: text(),
    ...timestamps(),
  },
  // Search pre-filters visible artists inside a bounding box of the radius.
  (table) => [index().on(table.status, table.baseLatitude, table.baseLongitude)],
);

/** One style an artist offers; keyed by (artist, style). */
export const artistStyles = pgTable(
  'artist_styles',
  {
    artistId: foreignId()
      .notNull()
      .references(() => artists.id, { onDelete: 'cascade' }),
    style: style().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.artistId, table.style] }),
    index().on(table.style, table.artistId),
  ],
);

/** Mean rating over distinct churches; null until the first review (L2-060). */
export const artistRatings = pgTable('artist_ratings', {
  artistId: foreignId()
    .primaryKey()
    .references(() => artists.id, { onDelete: 'cascade' }),
  rating: numeric({ precision: 2, scale: 1, mode: 'number' }),
  reviewCount: integer().notNull().default(0),
  recalculatedAt: timestamptz(),
});

/** A weekly default: the artist is unavailable every `weekday` (ISO, 1 = Monday). */
export const availabilityRules = pgTable(
  'availability_rules',
  {
    id: id(),
    artistId: foreignId()
      .notNull()
      .references(() => artists.id, { onDelete: 'cascade' }),
    weekday: smallint().notNull(),
    unavailable: boolean().notNull(),
  },
  (table) => [unique().on(table.artistId, table.weekday)],
);

/** Dated exceptions; a Free override beats the weekly rule. */
export const availabilityOverrides = pgTable(
  'availability_overrides',
  {
    id: id(),
    artistId: foreignId()
      .notNull()
      .references(() => artists.id, { onDelete: 'cascade' }),
    date: date({ mode: 'string' }).notNull(),
    state: overrideState().notNull(),
    note: varchar({ length: 100 }),
  },
  (table) => [unique().on(table.artistId, table.date)],
);

/**
 * The artist's secret calendar feed (L2-058): the token's SHA-256 hash for lookup and an encrypted
 * copy so the dialog can show the link again. Making a new link replaces both in one update.
 */
export const calendarFeeds = pgTable('calendar_feeds', {
  id: id(),
  artistId: foreignId()
    .notNull()
    .unique()
    .references(() => artists.id, { onDelete: 'cascade' }),
  tokenHash: varchar({ length: 64 }).notNull().unique(),
  tokenEncrypted: text().notNull(),
  enabledAt: timestamptz().notNull(),
  regeneratedAt: timestamptz(),
});

/** The setlist (L2-016). (artist, position) is unique and deferrable; see the migration. */
export const setlistSongs = pgTable(
  'setlist_songs',
  {
    id: uuid().primaryKey().defaultRandom(),
    artistId: foreignId()
      .notNull()
      .references(() => artists.id, { onDelete: 'cascade' }),
    position: smallint().notNull(),
    title: varchar({ length: 100 }).notNull(),
    writer: varchar({ length: 100 }),
    key: musicalKey().notNull(),
    ...timestamps(),
  },
  (table) => [check('setlist_songs_position_range', sql`${table.position} BETWEEN 1 AND 50`)],
);

/** The profile's photos (L2-015); keys are paths on the media disk. (artist, position) is deferrable. */
export const artistPhotos = pgTable('artist_photos', {
  id: uuid().primaryKey().defaultRandom(),
  artistId: foreignId()
    .notNull()
    .references(() => artists.id, { onDelete: 'cascade' }),
  position: smallint().notNull(),
  altText: varchar({ length: 150 }).notNull(),
  // The 400, 800, 1200 and 1600 px widths in AVIF and WebP (L2-051).
  renditions: jsonb().$type<PhotoRendition[]>().notNull().default([]),
  width: integer().notNull(),
  height: integer().notNull(),
  ...timestamps(),
});

/**
 * A performance video (L2-052): an artist's, or an applicant's while the application is in review,
 * when it has an upload token and no artist yet (apply-as-artist, ADR-0026).
 */
export const artistVideos = pgTable(
  'artist_videos',
  {
    id: uuid().primaryKey().defaultRandom(),
    artistId: foreignId().references(() => artists.id, { onDelete: 'cascade' }),
    artistApplicationId: foreignId().references(() => artistApplications.id, {
      onDelete: 'set null',
    }),
    position: smallint().notNull(),
    title: varchar({ length: 100 }).notNull(),
    status: videoStatus().notNull(),
    manifestKey: varchar({ length: 255 }),
    posterKey: varchar({ length: 255 }),
    captionsKey: varchar({ length: 255 }),
    durationSeconds: integer(),
    uploadToken: varchar({ length: 64 }).unique(),
    uploadId: uuid(),
    fileName: varchar({ length: 255 }),
    sizeBytes: foreignId(),
    uploadedBytes: foreignId().notNull().default(0),
    originalKey: varchar({ length: 255 }),
    failureReason: varchar({ length: 255 }),
    ...timestamps(),
  },
  (table) => [index().on(table.artistApplicationId)],
);

/** Every slug an artist has held (ADR-0011): the current one has no retired_at. */
export const slugHistories = pgTable('slug_histories', {
  id: id(),
  artistId: foreignId()
    .notNull()
    .references(() => artists.id),
  slug: varchar({ length: 255 }).notNull().unique(),
  retiredAt: timestamptz(),
  ...timestamps(),
});

/** A booker's saved artists (accounts/save-artist): one row each, newest first on the list page. */
export const savedArtists = pgTable(
  'saved_artists',
  {
    id: id(),
    userId: foreignId()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    artistId: foreignId()
      .notNull()
      .references(() => artists.id, { onDelete: 'cascade' }),
    createdAt: timestamptz()
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    unique().on(table.userId, table.artistId),
    index('saved_artists_user_id_created_at_index').on(table.userId, table.createdAt.desc()),
  ],
);
