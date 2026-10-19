import { regenerateCalendarFeed } from '@/server/actions/artist-availability/calendar-feed';
import { Role } from '@/server/enums';
import { routes } from '@/server/http/pipeline';
import {
  CalendarFeedResource,
  toCalendarFeedResource,
} from '@/server/http/resources/artist-availability/calendar-feed';
import { requireUser } from '@/server/support/request-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// A new secret link; the old one stops working at once (L2-058.2).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    POST: async () => {
      const feed = await regenerateCalendarFeed(requireUser().id);
      return Response.json(CalendarFeedResource.parse(toCalendarFeedResource(feed)));
    },
  },
  { name: 'artist.calendar-feed.regenerate', roles: [Role.Artist], cache: 'private' },
);
