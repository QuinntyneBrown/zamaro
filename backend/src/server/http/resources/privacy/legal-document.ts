import { z } from 'zod';
import type { LegalDocument } from '@/server/services/privacy/legal-document-registry';

/** One version of a legal document, as the sign-up form and the updated-terms page show it. */
export const LegalDocumentResource = z.object({
  /** The year and month it takes effect: "2026-10". */
  version: z.string(),
  effectiveFrom: z.iso.date(),
  url: z.string(),
  summaryOfChanges: z.array(z.string()),
});

export const CurrentLegalDocumentsResource = z.object({
  data: z.object({ terms: LegalDocumentResource, privacyPolicy: LegalDocumentResource }),
});

export function toLegalDocumentResource(
  document: LegalDocument,
): z.infer<typeof LegalDocumentResource> {
  return {
    version: document.version,
    effectiveFrom: document.effectiveFrom,
    url: document.url,
    summaryOfChanges: document.summaryOfChanges,
  };
}
