import { DateTime } from 'luxon';
import { z } from 'zod';
import type { ApplicationRow } from '@/server/actions/artist-onboarding/submit-artist-application';
import { ApplicationStatus, VideoStatus, valuesOf } from '@/server/enums';
import {
  businessDaysAfter,
  holidaysBetween,
} from '@/server/services/artist-onboarding/business-day-calendar';
import { ZONE } from '@/server/support/clock';

/**
 * The application as its applicant sees it (apply-as-artist): the number, the status, when it was
 * sent and the reply-by date. References are named, never their phone or email (L2-079).
 */
export const ArtistApplicationResource = z.object({
  data: z.object({
    id: z.number().int(),
    /** "A-0219". */
    number: z.string(),
    status: z.enum(valuesOf(ApplicationStatus)),
    name: z.string(),
    email: z.string(),
    /** When it was sent, Toronto time. */
    submittedAt: z.string(),
    /** `YYYY-MM-DD`: 3 business days after it was sent (L2-047.4). */
    replyBy: z.iso.date(),
    /** The statutory holidays the 3 business days skipped: "Monday 12 Oct is Thanksgiving". */
    skippedHolidays: z.array(z.object({ date: z.iso.date(), name: z.string() })),
    /** The videos, in order. */
    videos: z.array(
      z.object({ token: z.string(), title: z.string(), status: z.enum(valuesOf(VideoStatus)) }),
    ),
    /** The two references by name and church only. */
    references: z.array(z.object({ name: z.string(), church: z.string() })),
  }),
});

export interface ApplicationDetails {
  application: ApplicationRow;
  videos: { token: string; title: string; status: VideoStatus }[];
  references: { name: string; church: string }[];
}

export function toArtistApplicationResource(
  details: ApplicationDetails,
): z.infer<typeof ArtistApplicationResource> {
  const { application } = details;
  const submittedAt = DateTime.fromJSDate(application.submittedAt, { zone: ZONE });
  const replyBy = businessDaysAfter(submittedAt, 3);
  return {
    data: {
      id: application.id,
      number: application.number,
      status: application.status,
      name: application.name,
      email: application.email,
      submittedAt: submittedAt.toISO() ?? '',
      replyBy: replyBy.toISODate() ?? '',
      skippedHolidays: holidaysBetween(submittedAt, replyBy),
      videos: details.videos,
      references: details.references,
    },
  };
}
