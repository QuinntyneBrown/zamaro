import {
  enableCalendarFeed,
  showCalendarFeed,
} from '@/server/actions/artist-availability/calendar-feed';
import { Role } from '@/server/enums';
import { routes } from '@/server/http/pipeline';
import {
  CalendarFeedResource,
  toCalendarFeedResource,
} from '@/server/http/resources/artist-availability/calendar-feed';
import { HttpProblem, ProblemType } from '@/server/support/problems';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The artist's secret calendar feed (L2-058): GET shows the link once it is on, POST turns it on
// (201) or answers the current link (200). Artists only; the link is private to them (L2-074).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async () => {
      const feed = await showCalendarFeed(requireUser().id);
      if (feed === null) {
        throw new HttpProblem(ProblemType.NotFound, { detail: 'The calendar feed is not on.' });
      }
      return Response.json(CalendarFeedResource.parse(toCalendarFeedResource(feed)));
    },
    POST: async () => {
      const { feed, created } = await enableCalendarFeed(requireUser().id);
      return Response.json(CalendarFeedResource.parse(toCalendarFeedResource(feed)), {
        status: created ? 201 : 200,
      });
    },
  },
  {
    name: 'artist.calendar-feed.show',
    names: { POST: 'artist.calendar-feed.store' },
    roles: [Role.Artist],
    cache: 'private',
  },
);
