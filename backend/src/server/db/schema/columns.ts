import { sql } from 'drizzle-orm';
import { bigint, bigserial, timestamp } from 'drizzle-orm/pg-core';

// Shared column shapes. Every timestamp is `timestamptz` and read as a Date; dates are `date` strings.

export const id = () => bigserial({ mode: 'number' }).primaryKey();
export const foreignId = () => bigint({ mode: 'number' });
export const timestamptz = () => timestamp({ withTimezone: true, mode: 'date' });
export const timestamps = () => ({
  createdAt: timestamptz()
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamptz()
    .notNull()
    .default(sql`now()`),
});
