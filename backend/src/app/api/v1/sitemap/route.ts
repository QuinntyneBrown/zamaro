import { DateTime } from 'luxon';
import { listPublishedProfiles } from '@/server/actions/artist-profiles/list-published-profiles';
import { cachedJson } from '@/server/http/caching';
import { routes } from '@/server/http/pipeline';
import type { SitemapResource } from '@/server/http/resources/artist-profiles/dates';
import { ZONE } from '@/server/support/clock';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Every published profile and when it last changed. The web server serves it as `/sitemap.xml`
// with the site's own addresses (L2-112.3).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (request) => {
      const profiles = await listPublishedProfiles();
      const body: SitemapResource = {
        data: profiles.map((profile) => ({
          slug: profile.slug,
          lastModified: DateTime.fromJSDate(profile.updatedAt, { zone: ZONE }).toISODate() ?? '',
        })),
      };
      return cachedJson(request, body);
    },
  },
  { name: 'sitemap' },
);
