import { cachedJson } from '@/server/http/caching';
import { routes } from '@/server/http/pipeline';
import type { CatalogueResource } from '@/server/http/resources/user-experience/catalogue';
import { catalogueMessages, hasCatalogue } from '@/server/services/user-experience/catalogue';
import { HttpProblem, ProblemType } from '@/server/support/problems';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The translation catalogue for one locale, with English filling any missing key (L2-111.2).
// Revalidates with If-None-Match; an unchanged catalogue returns 304.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routes(
  {
    GET: async (request, { params }) => {
      const { locale } = await params;
      if (typeof locale !== 'string' || !hasCatalogue(locale)) {
        throw new HttpProblem(ProblemType.NotFound, {
          detail: `No catalogue for locale ${String(locale)}.`,
        });
      }
      const body: CatalogueResource = { data: { locale, messages: catalogueMessages(locale) } };
      return cachedJson(request, body);
    },
  },
  { name: 'i18n.show' },
);
