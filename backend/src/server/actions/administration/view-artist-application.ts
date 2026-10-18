import { asc, desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/server/db/client';
import {
  applicationReferences,
  artistApplications,
  artistVideos,
  users,
  vulnerableSectorChecks,
} from '@/server/db/schema';
import { AuditAction, AuditOutcome } from '@/server/enums';
import type { CurrentUser } from '@/server/services/accounts/current-user';
import { decryptField } from '@/server/support/encryption/field-cipher';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { recordAuditEntry } from '../audit/record-audit-entry';
import type { ApplicationRow } from './list-artist-applications';

export type ReferenceRow = typeof applicationReferences.$inferSelect;
export type ApplicationVideo = typeof artistVideos.$inferSelect;

/** One application as the review screen shows it (pages/admin-application). */
export interface ApplicationReview {
  application: ApplicationRow;
  /** Each reference with its contact decrypted (L2-079.2) and who verified it. */
  references: { row: ReferenceRow; contact: string; verifiedBy: string | null }[];
  videos: ApplicationVideo[];
  /** The applicant's latest Vulnerable Sector Check, when they have an account and uploaded one. */
  check: typeof vulnerableSectorChecks.$inferSelect | null;
}

/**
 * An administrator opens an application (L2-067.1). Opening it is audited as `application.viewed`
 * (L2-069.1) because it shows the references' personal contacts.
 *
 * @throws HttpProblem NotFound for an unknown application
 */
export async function viewArtistApplication(
  applicationId: number,
  administrator: CurrentUser,
  request: NextRequest,
): Promise<ApplicationReview> {
  const review = await describeApplication(applicationId);
  await recordAuditEntry({
    actor: administrator,
    action: AuditAction.ApplicationViewed,
    target: { type: 'artist_application', id: applicationId },
    outcome: AuditOutcome.Succeeded,
    request,
  });
  return review;
}

export async function describeApplication(applicationId: number): Promise<ApplicationReview> {
  const [application] = await db()
    .select()
    .from(artistApplications)
    .where(eq(artistApplications.id, applicationId));
  if (application === undefined) {
    throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
  }
  const [references, videos] = await Promise.all([
    db()
      .select({ row: applicationReferences, verifier: users.name })
      .from(applicationReferences)
      .leftJoin(users, eq(users.id, applicationReferences.verifiedBy))
      .where(eq(applicationReferences.artistApplicationId, application.id))
      .orderBy(asc(applicationReferences.id)),
    db()
      .select()
      .from(artistVideos)
      .where(eq(artistVideos.artistApplicationId, application.id))
      .orderBy(asc(artistVideos.position)),
  ]);
  const [check] =
    application.userId === null
      ? []
      : await db()
          .select()
          .from(vulnerableSectorChecks)
          .where(eq(vulnerableSectorChecks.userId, application.userId))
          .orderBy(desc(vulnerableSectorChecks.createdAt))
          .limit(1);
  return {
    application,
    references: references.map(({ row, verifier }) => ({
      row,
      contact: contactOf(row),
      verifiedBy: verifier,
    })),
    videos,
    check: check ?? null,
  };
}

/** The reference's email, or its phone as "647 555 0192", as the review mock prints it. */
function contactOf(reference: ReferenceRow): string {
  if (reference.email !== null) return decryptField(reference.email);
  if (reference.phone === null) return '';
  const digits = decryptField(reference.phone).replace(/\D/g, '').slice(-10);
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}
