import { buildCalendarFeed } from '@/server/actions/artist-availability/calendar-feed';
import { routes } from '@/server/http/pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The iCalendar feed a calendar application polls (L2-058.1): no session, the token in the link is
// the only key, so the request log shows the route's shape and never the token (L2-079.3). The one
// non-JSON answer under /api/v1; private and never cached (L2-089.3), kept out of search (noindex).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (_request, { params }) => {
      const { token } = (await params) as { token: string };
      const ics = await buildCalendarFeed(token.replace(/\.ics$/, ''));
      return new Response(ics, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'X-Robots-Tag': 'noindex',
        },
      });
    },
  },
  { name: 'calendar-feeds.show', cache: 'private', logPath: '/api/v1/calendar-feeds/[token]' },
);
