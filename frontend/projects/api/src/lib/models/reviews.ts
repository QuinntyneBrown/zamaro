/** A month as `YYYY-MM`: shown as "September 2026". */
export type CalendarMonth = string;

/** One public review (L2-018.1): only the reviewer's name, church, city and month (L2-083.2). */
export interface PublicReview {
  id: number;
  /** Whole stars, 1–5. */
  stars: number;
  /** Plain text as the church wrote it; paragraphs are separated by a blank line. */
  text: string;
  attribution: {
    /** "Rev. Janet Clarke". */
    reviewerName: string;
    /** "St. Brendan’s Anglican". */
    churchName: string;
    city: string;
    month: CalendarMonth;
  };
  /** The artist's reply, shown as "Reply from {artistName} · {month}", or null. */
  reply: { text: string; artistName: string; month: CalendarMonth } | null;
}

/** The newest reviews, carried by the profile so the section renders without a second request. */
export interface ProfileReviews {
  /** Visible reviews in all: "Show all 38 reviews". */
  total: number;
  /** Up to 4, newest first. */
  items: PublicReview[];
  /** Continues after the last item; null when there are no more. */
  nextCursor: string | null;
}

/** `GET /api/v1/artists/{slug}/reviews`: 10 at a time, newest first. */
export interface ReviewPage {
  reviews: PublicReview[];
  nextCursor: string | null;
}
