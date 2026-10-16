import { z } from 'zod';

/** The translation catalogue for one locale: ICU messages keyed `{namespace}.{key}` (L2-111.2). */
export const CatalogueResource = z.object({
  data: z.object({
    locale: z.string(),
    messages: z.record(z.string(), z.string()),
  }),
});

export type CatalogueResource = z.infer<typeof CatalogueResource>;
