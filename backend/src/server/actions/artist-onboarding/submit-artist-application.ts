import { and, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { applicationReferences, artistApplications, artistVideos } from '@/server/db/schema';
import { ApplicationStatus, VideoStatus } from '@/server/enums';
import { geocoder } from '@/server/integrations/bindings';
import type { SubmitArtistApplicationRequest } from '@/server/http/requests/artist-onboarding/application';
import { sendApplicationReceived } from '@/server/notifications/artist-onboarding/application-received';
import { serviceAreaContains } from '@/server/services/discovery/service-area';
import { now } from '@/server/support/clock';
import { encryptField } from '@/server/support/encryption/field-cipher';
import { toE164 } from '@/server/support/phone';
import { HttpProblem, ProblemType, ValidationProblem } from '@/server/support/problems';
import { squish } from '@/server/support/strings';
import { businessDaysAfter } from '@/server/services/artist-onboarding/business-day-calendar';
import { DateTime } from 'luxon';

export type ApplicationRow = typeof artistApplications.$inferSelect;

/** The cast's applications are A-0217 to A-0219; a fresh database starts there too. */
export const FIRST_APPLICATION_NUMBER = 217;
/** We reply within 3 business days (L2-047.4). */
export const REPLY_BUSINESS_DAYS = 3;

/**
 * A guest's application (apply-as-artist, L2-047): the same `Idempotency-Key` answers the application
 * it already created, before any other check; otherwise the videos must be the applicant's and
 * finished, a second pending application for the email is refused,
 * the base city is located inside the service area, and the application, its references and its
 * videos are written in one transaction. The confirmation goes once the transaction has committed.
 *
 * @throws HttpProblem ApplicationInReview when the email already has a pending application
 * @throws ValidationProblem on `baseCity` or a video
 */
export async function submitArtistApplication(
  data: SubmitArtistApplicationRequest,
  applicantUserId: number | null,
): Promise<{ application: ApplicationRow; created: boolean }> {
  const [repeat] = await db()
    .select()
    .from(artistApplications)
    .where(eq(artistApplications.idempotencyKey, data.idempotencyKey));
  if (repeat !== undefined) return { application: repeat, created: false };

  const email = data.email.trim().toLowerCase();
  await assertVideosAreTheApplicants(data.videos, data.idempotencyKey);
  const [pending] = await db()
    .select({ id: artistApplications.id })
    .from(artistApplications)
    .where(
      and(
        sql`lower(${artistApplications.email}) = ${email}`,
        eq(artistApplications.status, ApplicationStatus.Submitted),
      ),
    );
  if (pending !== undefined) throw inReview(email);
  const place = await locate(squish(data.baseCity));

  let application: ApplicationRow;
  try {
    application = await store(data, email, applicantUserId, place);
  } catch (error) {
    // Another send from the same email landed between the check above and this insert: the partial
    // unique index on lower(email) where submitted kept one (L2-047.3).
    if (isUniqueViolation(error)) throw inReview(email);
    throw error;
  }

  await sendApplicationReceived(
    { name: application.name, email: application.email },
    application.number,
    businessDaysAfter(DateTime.fromJSDate(application.submittedAt), REPLY_BUSINESS_DAYS),
  );
  return { application, created: true };
}

async function store(
  data: SubmitArtistApplicationRequest,
  email: string,
  applicantUserId: number | null,
  place: { city: string; latitude: number; longitude: number },
): Promise<ApplicationRow> {
  return db().transaction(async (tx) => {
    // Numbers never skip: the next is one past the last, read under a transaction-wide lock.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('artist_applications.number'))`);
    const [last] = await tx
      .select({ max: sql<string | null>`max(${artistApplications.number})` })
      .from(artistApplications);
    const lastNumber = Number((last?.max ?? '').slice(2)) || 0;
    const next = Math.max(lastNumber, FIRST_APPLICATION_NUMBER - 1) + 1;
    const at = now().toJSDate();
    const [application] = await tx
      .insert(artistApplications)
      .values({
        userId: applicantUserId,
        number: `A-${String(next).padStart(4, '0')}`,
        name: squish(data.name),
        email,
        actType: data.actType,
        baseCity: place.city,
        baseLatitude: place.latitude,
        baseLongitude: place.longitude,
        styles: data.styles,
        bio: data.bio.trim(),
        fromPriceCents: data.fromPrice * 100,
        maxDriveKm: data.maxDriveKm,
        status: ApplicationStatus.Submitted,
        idempotencyKey: data.idempotencyKey,
        submittedAt: at,
        createdAt: at,
        updatedAt: at,
      })
      .returning();
    if (application === undefined) throw new Error('The application could not be recorded.');
    for (const reference of data.references) {
      const contact = reference.contact.trim();
      const phone = toE164(contact);
      await tx.insert(applicationReferences).values({
        artistApplicationId: application.id,
        name: squish(reference.name),
        church: squish(reference.church),
        phone: phone === null ? null : encryptField(phone),
        email: phone === null ? encryptField(contact.toLowerCase()) : null,
      });
    }
    for (const [index, token] of data.videos.entries()) {
      await tx
        .update(artistVideos)
        .set({ artistApplicationId: application.id, position: index + 1, updatedAt: at })
        .where(and(eq(artistVideos.uploadToken, token), isNull(artistVideos.artistApplicationId)));
    }
    return application;
  });
}

/**
 * A video is the applicant's while unattached, or once attached by an earlier send that carried this
 * same Idempotency-Key, so the retry passes (L2-047.5); and it has finished uploading.
 */
async function assertVideosAreTheApplicants(tokens: string[], key: string): Promise<void> {
  const rows = await db()
    .select({ token: artistVideos.uploadToken, status: artistVideos.status })
    .from(artistVideos)
    .leftJoin(artistApplications, eq(artistApplications.id, artistVideos.artistApplicationId))
    .where(
      and(
        inArray(artistVideos.uploadToken, tokens),
        or(isNull(artistVideos.artistApplicationId), eq(artistApplications.idempotencyKey, key)),
      ),
    );
  const usable = new Map(rows.map((row) => [row.token, row.status]));
  const errors: Record<string, string[]> = {};
  for (const [index, token] of tokens.entries()) {
    const status = usable.get(token);
    if (status !== VideoStatus.Live && status !== VideoStatus.Processing) {
      errors[`videos.${String(index)}`] = [
        'Upload at least one video, and wait for each one to finish.',
      ];
    }
  }
  if (Object.keys(errors).length > 0) throw new ValidationProblem(errors);
}

/** The base city, found and inside the service area (L2-001). */
async function locate(
  city: string,
): Promise<{ city: string; latitude: number; longitude: number }> {
  const place = await geocoder().geocode(city);
  if (place === null) {
    throw new ValidationProblem({
      baseCity: ['We couldn’t find that address. Check the street and postal code.'],
    });
  }
  if (!(await serviceAreaContains(place.point))) {
    throw new ValidationProblem({ baseCity: ['Zamaro serves churches within 200 km of Toronto.'] });
  }
  return { city: place.city, latitude: place.point.latitude, longitude: place.point.longitude };
}

function inReview(email: string): HttpProblem {
  return new HttpProblem(ProblemType.ApplicationInReview, {
    detail: `We’re reviewing the one you sent from ${email} and will reply there. Your answers here are kept.`,
    extensions: { email },
  });
}

function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: string; cause?: { code?: string } }).code;
  const causeCode = (error as { cause?: { code?: string } }).cause?.code;
  const message = error instanceof Error ? error.message : '';
  return (
    code === '23505' ||
    causeCode === '23505' ||
    message.includes('artist_applications_one_pending_per_email')
  );
}
