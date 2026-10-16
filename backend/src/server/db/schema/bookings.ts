import { sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  pgTable,
  smallint,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './accounts';
import { artists } from './artists';
import { foreignId, id, timestamps, timestamptz } from './columns';
import { bookingStatus, gatheringKind } from './enums';

/** The columns search and tour dates read; booker, church and payment columns arrive with M5. */
export const bookings = pgTable(
  'bookings',
  {
    id: id(),
    number: varchar({ length: 255 }).notNull().unique(),
    artistId: foreignId()
      .notNull()
      .references(() => artists.id),
    status: bookingStatus().notNull(),
    eventDate: date({ mode: 'string' }).notNull(),
    kind: gatheringKind().notNull(),
    churchName: varchar({ length: 255 }).notNull(),
    churchCity: varchar({ length: 255 }).notNull(),
    ...timestamps(),
  },
  (table) => [
    index().on(table.artistId, table.eventDate),
    // L2-032: an artist has at most one Confirmed booking per date.
    uniqueIndex('bookings_one_confirmed_per_date')
      .on(table.artistId, table.eventDate)
      .where(sql`${table.status} = 'confirmed'`),
  ],
);

/** Every status change of a booking; the headliner counts transitions to Confirmed (L2-006). */
export const bookingTransitions = pgTable(
  'booking_transitions',
  {
    id: id(),
    bookingId: foreignId()
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    fromStatus: bookingStatus(),
    toStatus: bookingStatus().notNull(),
    actorKind: varchar({ length: 255 }).notNull(),
    actorId: foreignId().references(() => users.id),
    reason: varchar({ length: 255 }),
    occurredAt: timestamptz().notNull(),
  },
  (table) => [index().on(table.toStatus, table.occurredAt)],
);

/** One review per booking; hidden by moderation when hidden_at is set (L2-060, L2-062). */
export const reviews = pgTable(
  'reviews',
  {
    id: id(),
    bookingId: foreignId()
      .notNull()
      .unique()
      .references(() => bookings.id),
    artistId: foreignId()
      .notNull()
      .references(() => artists.id),
    bookerId: foreignId()
      .notNull()
      .references(() => users.id),
    stars: smallint().notNull(),
    text: text().notNull(),
    createdAt: timestamptz().notNull(),
    editedAt: timestamptz(),
    hiddenAt: timestamptz(),
    hiddenReason: varchar({ length: 255 }),
    hiddenBy: foreignId().references(() => users.id),
  },
  (table) => [
    check('reviews_stars_range', sql`${table.stars} BETWEEN 1 AND 5`),
    index('reviews_visible_newest')
      .on(table.artistId, table.createdAt.desc(), table.id.desc())
      .where(sql`${table.hiddenAt} IS NULL`),
  ],
);

/** The artist's one public reply to a review, shown beneath it (L2-018.3, L2-061). */
export const reviewReplies = pgTable('review_replies', {
  id: id(),
  reviewId: foreignId()
    .notNull()
    .unique()
    .references(() => reviews.id, { onDelete: 'cascade' }),
  artistId: foreignId()
    .notNull()
    .references(() => artists.id),
  text: varchar({ length: 500 }).notNull(),
  createdAt: timestamptz().notNull(),
  editedAt: timestamptz(),
});
