import { z } from 'zod';

export const AcceptTermsRequest = z.object({
  /** The terms version the page showed (`GET /legal-documents/current`); 409 when it is no longer current. */
  termsVersion: z.string({ error: 'The terms version is missing.' }).length(7, 'Not a version.'),
});

export const MarketingChoiceRequest = z.object({
  /** Whether the person wants emails about new artists near their church. */
  granted: z.boolean({ error: 'Tick or untick the box.' }),
});
