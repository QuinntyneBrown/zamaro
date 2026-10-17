import { DateTime } from 'luxon';
import { z } from 'zod';
import type { ReviewRow } from '@/server/actions/reviews/list-artist-reviews';
import { ZONE } from '@/server/support/clock';

/**
 * One public review: the stars, the church's words and who said them. Only the reviewer's name,
 * church, city and month leave the server; never the booker's account, email, booking number or
 * event date (L2-083.2).
 */
export const ReviewResource = z.object({
  id: z.number().int(),
  /** Whole stars, 1–5. */
  stars: z.number().int(),
  /** Plain text as the church wrote it; paragraphs are separated by a blank line. */
  text: z.string(),
  attribution: z.object({
    reviewerName: z.string(),
    /** The church as it was named on the booking: "St. Brendan’s Anglican". */
    churchName: z.string(),
    city: z.string(),
    /** When the review was written, as `YYYY-MM`: shown as "September 2026". */
    month: z.string(),
  }),
  /** The artist's reply, shown beneath as "Reply from {artistName} · {month}", or null. */
  reply: z.object({ text: z.string(), artistName: z.string(), month: z.string() }).nullable(),
});

export const ReviewPageResource = z.object({
  data: z.array(ReviewResource),
  meta: z.object({
    perPage: z.number().int(),
    /** Pass as `cursor` for the next page; null on the last page. */
    nextCursor: z.string().nullable(),
  }),
});

export type ReviewResource = z.infer<typeof ReviewResource>;
export type ReviewPageResource = z.infer<typeof ReviewPageResource>;

export function toReviewResource(review: ReviewRow): ReviewResource {
  return {
    id: review.id,
    stars: review.stars,
    text: review.text,
    attribution: {
      reviewerName: review.reviewerName,
      churchName: review.churchName,
      city: review.churchCity,
      month: month(review.createdAt),
    },
    reply:
      review.reply === null
        ? null
        : {
            text: review.reply.text,
            artistName: review.reply.artistName,
            month: month(review.reply.createdAt),
          },
  };
}

function month(at: Date): string {
  return DateTime.fromJSDate(at, { zone: ZONE }).toFormat('yyyy-MM');
}
