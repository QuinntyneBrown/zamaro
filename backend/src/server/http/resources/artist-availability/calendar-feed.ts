import { z } from 'zod';

/** The artist's feed as the dialog shows it: the secret link and when it was made (L2-058). */
export const CalendarFeedResource = z.object({
  data: z.object({
    url: z.url(),
    enabledAt: z.iso.datetime(),
    regeneratedAt: z.iso.datetime().nullable(),
  }),
});

export function toCalendarFeedResource(feed: {
  url: string;
  enabledAt: Date;
  regeneratedAt: Date | null;
}): z.infer<typeof CalendarFeedResource> {
  return {
    data: {
      url: feed.url,
      enabledAt: feed.enabledAt.toISOString(),
      regeneratedAt: feed.regeneratedAt?.toISOString() ?? null,
    },
  };
}
