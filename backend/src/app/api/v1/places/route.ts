import { routes } from '@/server/http/pipeline';
import { LookUpPlaceRequest } from '@/server/http/requests/discovery/look-up-place';
import type { PlaceResource } from '@/server/http/resources/discovery/place';
import { validateQuery } from '@/server/http/validation';
import { geocoder } from '@/server/integrations/bindings';
import { HttpProblem, ProblemType } from '@/server/support/problems';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The centre point of a typed town or a quick-pick city, for the Discover location field (L2-004.6).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (request) => {
      const { q } = validateQuery(request, LookUpPlaceRequest);
      const place = await geocoder().geocode(q);
      if (place === null) {
        throw new HttpProblem(ProblemType.NotFound, { detail: 'No place matches that name.' });
      }
      const body: PlaceResource = {
        data: {
          label: place.normalisedAddress,
          city: place.city,
          lat: place.point.latitude,
          lng: place.point.longitude,
        },
      };
      return Response.json(body);
    },
  },
  { name: 'places' },
);
