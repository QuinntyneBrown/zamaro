import { and, asc, desc, eq, inArray, ne } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { artists, users, vulnerableSectorChecks } from '@/server/db/schema';
import { VscStatus } from '@/server/enums';
import type { CheckRow } from '../artist-onboarding/upload-vulnerable-sector-check';

/** A check as the admin queue shows it: whose, its decision and what it replaces (pages/admin-checks). */
export interface AdminCheckView {
  check: CheckRow;
  artist: { id: number | null; name: string; slug: string | null };
  verifiedBy: { name: string } | null;
  /** The artist's verified check this one replaces, or null for a first check. */
  replaces: { verifiedUntil: string } | null;
}

/** The checks waiting for verification, oldest upload first (L2-049.2). */
export async function listChecksWaiting(): Promise<AdminCheckView[]> {
  const waiting = await db()
    .select()
    .from(vulnerableSectorChecks)
    .where(eq(vulnerableSectorChecks.status, VscStatus.Pending))
    .orderBy(asc(vulnerableSectorChecks.createdAt), asc(vulnerableSectorChecks.id));
  return describeChecks(waiting);
}

/** One check, described for the queue. */
export async function describeCheck(check: CheckRow): Promise<AdminCheckView> {
  const [view] = await describeChecks([check]);
  if (view === undefined) throw new Error('The check could not be described.');
  return view;
}

async function describeChecks(checks: CheckRow[]): Promise<AdminCheckView[]> {
  if (checks.length === 0) return [];
  const userIds = [...new Set(checks.map((check) => check.userId))];
  const verifierIds = [
    ...new Set(checks.map((check) => check.verifiedBy).filter((id): id is number => id !== null)),
  ];
  const [people, profiles, verifiers] = await Promise.all([
    db().select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, userIds)),
    db()
      .select({
        userId: artists.userId,
        id: artists.id,
        name: artists.displayName,
        slug: artists.slug,
      })
      .from(artists)
      .where(inArray(artists.userId, userIds)),
    verifierIds.length === 0
      ? Promise.resolve([])
      : db()
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(inArray(users.id, verifierIds)),
  ]);
  const names = new Map(people.map((person) => [person.id, person.name]));
  const byUser = new Map(profiles.map((profile) => [profile.userId, profile]));
  const verifierNames = new Map(verifiers.map((person) => [person.id, person.name]));

  const views: AdminCheckView[] = [];
  for (const check of checks) {
    const profile = byUser.get(check.userId);
    const [replaced] = await db()
      .select({ expiresOn: vulnerableSectorChecks.expiresOn })
      .from(vulnerableSectorChecks)
      .where(
        and(
          eq(vulnerableSectorChecks.userId, check.userId),
          eq(vulnerableSectorChecks.status, VscStatus.Verified),
          ne(vulnerableSectorChecks.id, check.id),
        ),
      )
      .orderBy(desc(vulnerableSectorChecks.expiresOn))
      .limit(1);
    views.push({
      check,
      artist: {
        id: profile?.id ?? null,
        name: profile?.name ?? names.get(check.userId) ?? '',
        slug: profile?.slug ?? null,
      },
      verifiedBy:
        check.verifiedBy === null ? null : { name: verifierNames.get(check.verifiedBy) ?? '' },
      replaces:
        replaced?.expiresOn === undefined || replaced.expiresOn === null
          ? null
          : { verifiedUntil: replaced.expiresOn },
    });
  }
  return views;
}
