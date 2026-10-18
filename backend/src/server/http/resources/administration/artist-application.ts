import { DateTime } from 'luxon';
import { z } from 'zod';
import type { ApplicationRow } from '@/server/actions/administration/list-artist-applications';
import type { ApplicationReview } from '@/server/actions/administration/view-artist-application';
import { ActType, ApplicationStatus, VideoStatus, VscStatus, valuesOf } from '@/server/enums';
import { ZONE } from '@/server/support/clock';
import { mediaUrl } from '@/server/support/media';

/** A row of the application queue (pages/admin-applications). */
export const AdminApplicationRowResource = z.object({
  id: z.number().int(),
  /** The applicant-facing number, such as `A-0219`. */
  number: z.string(),
  name: z.string(),
  actType: z.enum(valuesOf(ActType)),
  baseCity: z.string(),
  /** When it was submitted, Toronto time. */
  submittedAt: z.string(),
});

export const AdminApplicationQueueResource = z.object({
  data: z.array(AdminApplicationRowResource),
  meta: z.object({ waiting: z.number().int() }),
});

export function toAdminApplicationRow(
  application: ApplicationRow,
): z.infer<typeof AdminApplicationRowResource> {
  return {
    id: application.id,
    number: application.number,
    name: application.name,
    actType: application.actType,
    baseCity: application.baseCity,
    submittedAt: DateTime.fromJSDate(application.submittedAt, { zone: ZONE }).toISO() ?? '',
  };
}

/** An applicant's reference: the contact decrypted for the administrator who calls them (L2-079.2). */
export const AdminReferenceResource = z.object({
  id: z.number().int(),
  name: z.string(),
  church: z.string(),
  /** An email address, or a phone number as "647 555 0192". */
  contact: z.string(),
  /** When an administrator confirmed the reference, or null. */
  verifiedAt: z.string().nullable(),
  verifiedBy: z.object({ name: z.string() }).nullable(),
});

export const AdminReferenceEnvelope = z.object({ data: AdminReferenceResource });

export function toAdminReference({
  row,
  contact,
  verifiedBy,
}: ApplicationReview['references'][number]): z.infer<typeof AdminReferenceResource> {
  return {
    id: row.id,
    name: row.name,
    church: row.church,
    contact,
    verifiedAt:
      row.verifiedAt === null
        ? null
        : (DateTime.fromJSDate(row.verifiedAt, { zone: ZONE }).toISO() ?? null),
    verifiedBy: verifiedBy === null ? null : { name: verifiedBy },
  };
}

export const AdminApplicationVideoResource = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(valuesOf(VideoStatus)),
  durationSeconds: z.number().int().nullable(),
  posterUrl: z.string().nullable(),
  manifestUrl: z.string().nullable(),
});

/** The review screen (pages/admin-application): every detail the administrator needs to decide. */
export const AdminApplicationResource = AdminApplicationRowResource.extend({
  status: z.enum(valuesOf(ApplicationStatus)),
  email: z.string(),
  styles: z.array(z.string()),
  fromPriceCents: z.number().int(),
  maxDriveKm: z.number().int(),
  bio: z.string(),
  references: z.array(AdminReferenceResource),
  videos: z.array(AdminApplicationVideoResource),
  /** When it was decided, and by whom; null while Submitted. */
  decidedAt: z.string().nullable(),
  decidedBy: z.object({ name: z.string() }).nullable(),
  /** The applicant's latest Vulnerable Sector Check, or null when none is uploaded. */
  vsc: z
    .object({ id: z.number().int(), issuedOn: z.iso.date(), status: z.enum(valuesOf(VscStatus)) })
    .nullable(),
});

export const AdminApplicationEnvelope = z.object({ data: AdminApplicationResource });

export function toAdminApplication(
  review: ApplicationReview,
): z.infer<typeof AdminApplicationResource> {
  const { application } = review;
  return {
    ...toAdminApplicationRow(application),
    status: application.status,
    email: application.email,
    styles: application.styles,
    fromPriceCents: application.fromPriceCents,
    maxDriveKm: application.maxDriveKm,
    bio: application.bio,
    references: review.references.map(toAdminReference),
    videos: review.videos.map((video) => ({
      id: video.id,
      title: video.title,
      status: video.status,
      durationSeconds: video.durationSeconds,
      posterUrl: video.posterKey === null ? null : mediaUrl(video.posterKey),
      manifestUrl: video.manifestKey === null ? null : mediaUrl(video.manifestKey),
    })),
    decidedAt:
      application.decidedAt === null
        ? null
        : (DateTime.fromJSDate(application.decidedAt, { zone: ZONE }).toISO() ?? null),
    decidedBy: review.decidedBy === null ? null : { name: review.decidedBy },
    vsc:
      review.check === null
        ? null
        : { id: review.check.id, issuedOn: review.check.issuedOn, status: review.check.status },
  };
}
