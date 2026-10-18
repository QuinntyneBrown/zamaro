import { and, eq, sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/server/db/client';
import {
  applicationReferences,
  artists,
  artistApplications,
  artistStyles,
  artistVideos,
  slugHistories,
  users,
} from '@/server/db/schema';
import {
  ApplicationStatus,
  ArtistStatus,
  AuditAction,
  AuditOutcome,
  Role,
  Style,
  valuesOf,
} from '@/server/enums';
import { sendApplicationApproved } from '@/server/notifications/artist-onboarding/application-approved';
import type { CurrentUser } from '@/server/services/accounts/current-user';
import { grantRoles } from '@/server/services/accounts/roles';
import { generateArtistSlug } from '@/server/services/artist-onboarding/generate-artist-slug';
import { now } from '@/server/support/clock';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { hashPassword } from '@/server/support/passwords';
import { randomToken } from '../accounts/issue-email-verification-token';
import { issuePasswordResetToken } from '../accounts/issue-password-reset-token';
import { recordAuditEntry } from '../audit/record-audit-entry';

/** What approval refuses with while a reference is unconfirmed (L2-048.1). */
export const VERIFY_BOTH_REFERENCES = 'Verify both references before you approve.';

/**
 * An administrator approves an application (L2-048.1). Inside one transaction, with the
 * application locked, it needs the status Submitted and both references verified; finds the
 * applicant's account by email, or makes one with no usable password (M3 D3); grants the Artist
 * role; creates the artist, Approved but unpublished and not payout-ready (L2-048.3), with a slug
 * and the next ACT number (M3 D4); and moves the application's videos to the artist. The decision,
 * the artist and the role change are audited. After commit the applicant is emailed the next step.
 *
 * @throws HttpProblem NotFound, ApplicationAlreadyDecided, or ValidationFailed while a reference is unverified
 */
export async function approveArtistApplication(
  applicationId: number,
  administrator: CurrentUser,
  request: NextRequest,
): Promise<void> {
  const outcome = await db().transaction(async (tx) => {
    const [application] = await tx
      .select()
      .from(artistApplications)
      .where(eq(artistApplications.id, applicationId))
      .for('update');
    if (application === undefined) {
      throw new HttpProblem(ProblemType.NotFound, { detail: 'No route matches this address.' });
    }
    if (application.status !== ApplicationStatus.Submitted) {
      throw new HttpProblem(ProblemType.ApplicationAlreadyDecided, {
        detail: 'This application was already decided.',
      });
    }
    const references = await tx
      .select({ verifiedAt: applicationReferences.verifiedAt })
      .from(applicationReferences)
      .where(eq(applicationReferences.artistApplicationId, application.id));
    if (references.length === 0 || references.some(({ verifiedAt }) => verifiedAt === null)) {
      throw new HttpProblem(ProblemType.ValidationFailed, { detail: VERIFY_BOTH_REFERENCES });
    }

    const at = now().toJSDate();
    const email = application.email.trim().toLowerCase();
    const [existing] = await tx
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .for('update');
    const created = existing === undefined;
    const user =
      existing ??
      (
        await tx
          .insert(users)
          .values({
            name: application.name,
            email,
            // No usable password: the applicant sets one from the link in the approval email.
            password: await hashPassword(randomToken(48)),
            emailVerifiedAt: at,
            createdAt: at,
            updatedAt: at,
          })
          .returning({ id: users.id, name: users.name, email: users.email })
      )[0];
    if (user === undefined) throw new Error('The applicant could not be given an account.');

    await grantRoles(tx, user.id, [Role.Artist]);
    await recordAuditEntry(
      {
        actor: administrator,
        action: AuditAction.RoleChanged,
        target: { type: 'user', id: user.id },
        outcome: AuditOutcome.Succeeded,
        context: { granted: Role.Artist, application_id: application.id },
        request,
      },
      tx,
    );

    const [latest] = await tx
      .select({ max: sql<string | null>`max(${artists.ticketNumber})` })
      .from(artists);
    const next = Number((latest?.max ?? 'ACT-0000').replace(/\D/g, '')) + 1;
    const ticketNumber = `ACT-${String(next).padStart(4, '0')}`;
    const slug = await generateArtistSlug(tx, application.name, ticketNumber);
    const [artist] = await tx
      .insert(artists)
      .values({
        userId: user.id,
        slug,
        ticketNumber,
        displayName: application.name,
        actType: application.actType,
        baseCity: application.baseCity,
        baseLatitude: application.baseLatitude,
        baseLongitude: application.baseLongitude,
        maxDriveKm: application.maxDriveKm,
        fromPriceCents: application.fromPriceCents,
        status: ArtistStatus.Approved,
        payoutReady: false,
        publishedAt: null,
        approvedAt: at,
        bio: application.bio,
        createdAt: at,
        updatedAt: at,
      })
      .returning({ id: artists.id });
    if (artist === undefined) throw new Error('The artist could not be created.');
    await tx
      .insert(slugHistories)
      .values({ artistId: artist.id, slug, createdAt: at, updatedAt: at });
    const known = new Set<string>(valuesOf(Style));
    const styles = application.styles.filter((value): value is Style => known.has(value));
    if (styles.length > 0) {
      await tx.insert(artistStyles).values(styles.map((style) => ({ artistId: artist.id, style })));
    }
    await tx
      .update(artistVideos)
      .set({ artistId: artist.id, updatedAt: at })
      .where(and(eq(artistVideos.artistApplicationId, application.id)));
    await tx
      .update(artistApplications)
      .set({
        userId: user.id,
        status: ApplicationStatus.Approved,
        decidedAt: at,
        decidedBy: administrator.id,
        updatedAt: at,
      })
      .where(eq(artistApplications.id, application.id));
    await recordAuditEntry(
      {
        actor: administrator,
        action: AuditAction.ApplicationApproved,
        target: { type: 'artist_application', id: application.id },
        outcome: AuditOutcome.Succeeded,
        context: { artist_id: artist.id, ticket_number: ticketNumber },
        request,
      },
      tx,
    );
    const resetToken = created ? await issuePasswordResetToken(tx, user.id) : null;
    return { user, resetToken };
  });
  await sendApplicationApproved(
    { name: outcome.user.name, email: outcome.user.email },
    outcome.resetToken,
  );
}
