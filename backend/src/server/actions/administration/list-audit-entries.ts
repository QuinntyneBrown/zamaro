import { and, desc, eq, inArray, lt, lte, gte, or, sql, type SQL } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { db } from '@/server/db/client';
import { artists, auditEntries, bookings, users } from '@/server/db/schema';
import type { AuditOutcome } from '@/server/enums';
import { ZONE } from '@/server/support/clock';

export const AUDIT_PAGE_SIZE = 50;

export interface AuditFilters {
  actor?: string | undefined;
  action?: string | undefined;
  target?: string | undefined;
  outcome?: AuditOutcome | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

export type AuditEntryRow = typeof auditEntries.$inferSelect;

/** One row with what the viewer shows beside it: the actor's account and the target's label. */
export interface AuditEntryView {
  entry: AuditEntryRow;
  actor: { name: string; email: string } | null;
  targetLabel: string | null;
}

export interface AuditPage {
  entries: AuditEntryView[];
  nextCursor: string | null;
}

/** Where the previous page stopped: the entry's time and id, newest first. */
export interface AuditCursor {
  occurredAt: Date;
  id: number;
}

export function encodeAuditCursor(cursor: AuditCursor): string {
  return Buffer.from(`${String(cursor.occurredAt.getTime())}|${String(cursor.id)}`).toString(
    'base64url',
  );
}

/** The cursor, or null when it is anything but one over the log's order. */
export function decodeAuditCursor(value: string): AuditCursor | null {
  const decoded = Buffer.from(value, 'base64url').toString();
  const match = /^(\d+)\|(\d+)$/.exec(decoded);
  if (match === null) return null;
  return { occurredAt: new Date(Number(match[1])), id: Number(match[2]) };
}

/**
 * The audit log as the admin viewer reads it (administration/record-audit-log, L2-069): newest
 * first, 50 at a time by cursor, narrowed by actor email, action, target, outcome and a date range
 * in Toronto time. Reading only: nothing here changes or deletes an entry (L2-069.2).
 */
export async function listAuditEntries(
  filters: AuditFilters,
  cursor: AuditCursor | null,
): Promise<AuditPage> {
  const conditions: SQL[] = [];
  if (filled(filters.actor)) {
    const email = filters.actor.trim().toLowerCase();
    conditions.push(
      inArray(
        auditEntries.actorId,
        db()
          .select({ id: users.id })
          .from(users)
          .where(sql`lower(${users.email}) = ${email}`),
      ),
    );
  }
  if (filled(filters.action)) conditions.push(eq(auditEntries.action, filters.action));
  if (filters.outcome !== undefined) conditions.push(eq(auditEntries.outcome, filters.outcome));
  if (filled(filters.target)) conditions.push(targetMatches(filters.target.trim()));
  if (filled(filters.from)) {
    conditions.push(
      gte(
        auditEntries.occurredAt,
        DateTime.fromISO(filters.from, { zone: ZONE }).startOf('day').toJSDate(),
      ),
    );
  }
  if (filled(filters.to)) {
    conditions.push(
      lte(
        auditEntries.occurredAt,
        DateTime.fromISO(filters.to, { zone: ZONE }).endOf('day').toJSDate(),
      ),
    );
  }
  if (cursor !== null) {
    conditions.push(
      or(
        lt(auditEntries.occurredAt, cursor.occurredAt),
        and(eq(auditEntries.occurredAt, cursor.occurredAt), lt(auditEntries.id, cursor.id)),
      ) ?? sql`true`,
    );
  }

  const rows = await db()
    .select()
    .from(auditEntries)
    .where(conditions.length === 0 ? undefined : and(...conditions))
    .orderBy(desc(auditEntries.occurredAt), desc(auditEntries.id))
    .limit(AUDIT_PAGE_SIZE + 1);
  const page = rows.slice(0, AUDIT_PAGE_SIZE);
  const last = page[page.length - 1];
  return {
    entries: await describe(page),
    nextCursor:
      rows.length > AUDIT_PAGE_SIZE && last !== undefined
        ? encodeAuditCursor({ occurredAt: last.occurredAt, id: last.id })
        : null,
  };
}

/** One entry by id, described, or null. */
export async function findAuditEntry(id: number): Promise<AuditEntryView | null> {
  const [row] = await db().select().from(auditEntries).where(eq(auditEntries.id, id));
  if (row === undefined) return null;
  const [view] = await describe([row]);
  return view ?? null;
}

/** A booking by its number, or an artist or user whose name (or a user's email) contains the text. */
function targetMatches(text: string): SQL {
  const like = `%${text.toLowerCase().replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  return (
    or(
      and(
        eq(auditEntries.targetType, 'booking'),
        inArray(
          auditEntries.targetId,
          db()
            .select({ id: bookings.id })
            .from(bookings)
            .where(sql`lower(${bookings.number}) like ${like}`),
        ),
      ),
      and(
        eq(auditEntries.targetType, 'artist'),
        inArray(
          auditEntries.targetId,
          db()
            .select({ id: artists.id })
            .from(artists)
            .where(sql`lower(${artists.displayName}) like ${like}`),
        ),
      ),
      and(
        eq(auditEntries.targetType, 'user'),
        inArray(
          auditEntries.targetId,
          db()
            .select({ id: users.id })
            .from(users)
            .where(sql`lower(${users.name}) like ${like} or lower(${users.email}) like ${like}`),
        ),
      ),
    ) ?? sql`false`
  );
}

/** The actors' accounts and the targets' labels, loaded once for the page. */
async function describe(rows: AuditEntryRow[]): Promise<AuditEntryView[]> {
  const userIds = new Set<number>();
  const artistIds = new Set<number>();
  const bookingIds = new Set<number>();
  for (const row of rows) {
    if (row.actorId !== null) userIds.add(row.actorId);
    if (row.targetId === null) continue;
    if (row.targetType === 'user') userIds.add(row.targetId);
    if (row.targetType === 'artist') artistIds.add(row.targetId);
    if (row.targetType === 'booking') bookingIds.add(row.targetId);
  }
  const people = new Map(
    (userIds.size === 0
      ? []
      : await db()
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(inArray(users.id, [...userIds]))
    ).map((user) => [user.id, user]),
  );
  const names = new Map(
    (artistIds.size === 0
      ? []
      : await db()
          .select({ id: artists.id, name: artists.displayName })
          .from(artists)
          .where(inArray(artists.id, [...artistIds]))
    ).map((artist) => [artist.id, artist.name]),
  );
  const numbers = new Map(
    (bookingIds.size === 0
      ? []
      : await db()
          .select({ id: bookings.id, number: bookings.number })
          .from(bookings)
          .where(inArray(bookings.id, [...bookingIds]))
    ).map((booking) => [booking.id, booking.number]),
  );
  return rows.map((entry) => {
    const actor = entry.actorId === null ? undefined : people.get(entry.actorId);
    let targetLabel: string | null = null;
    if (entry.targetId !== null) {
      if (entry.targetType === 'user') targetLabel = people.get(entry.targetId)?.name ?? null;
      if (entry.targetType === 'artist') targetLabel = names.get(entry.targetId) ?? null;
      if (entry.targetType === 'booking') targetLabel = numbers.get(entry.targetId) ?? null;
    }
    return {
      entry,
      actor: actor === undefined ? null : { name: actor.name, email: actor.email },
      targetLabel,
    };
  });
}

function filled(value: string | undefined): value is string {
  return value !== undefined && value.trim() !== '';
}
